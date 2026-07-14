import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { Calendar, ArrowLeft, Save, Dices, Pencil, Check } from 'lucide-react';
import { db, useLiveQuery, getPresenceList, savePresenceList, getSystemConfig, setSystemConfig } from '../db';
import { getInitials } from '../utils/formatters';
import { useToast } from '../components/ToastContext';

function getNextSaturday1830() {
  const now = new Date();
  const resultDate = new Date();
  resultDate.setDate(now.getDate() + (6 - now.getDay() + 7) % 7);
  resultDate.setHours(18, 30, 0, 0);
  if (resultDate < now) {
    resultDate.setDate(resultDate.getDate() + 7);
  }
  return resultDate;
}

function toDatetimeLocalString(date) {
  const tzoffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
}

function formatFriendlyDatetime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const parts = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return parts.charAt(0).toUpperCase() + parts.slice(1);
}

export default function NextMatch() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useOutletContext();
  const players = useLiveQuery(() => db.players.orderBy('name').toArray());

  const [confirmed, setConfirmed] = useState([]);
  const [saving, setSaving] = useState(false);

  // Next match datetime config
  const [matchDatetime, setMatchDatetime] = useState('');
  const [inputDatetime, setInputDatetime] = useState('');
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [savingDate, setSavingDate] = useState(false);

  useEffect(() => {
    // Load confirmed list
    getPresenceList().then(list => {
      setConfirmed(list || []);
    });

    // Load custom next match datetime
    getSystemConfig('next_match_datetime').then(val => {
      if (val) {
        setMatchDatetime(val);
        setInputDatetime(val);
      } else {
        const fallback = getNextSaturday1830().toISOString();
        setMatchDatetime(fallback);
        setInputDatetime(toDatetimeLocalString(new Date(fallback)));
      }
    });
  }, []);

  const togglePresence = (id) => {
    setConfirmed(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePresenceList(confirmed);
      toast.success('Lista de confirmados salva com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar lista: ' + err.message);
    }
    setSaving(false);
  };

  const handleSaveDate = async () => {
    if (!inputDatetime) return;
    setSavingDate(true);
    try {
      const isoString = new Date(inputDatetime).toISOString();
      await setSystemConfig('next_match_datetime', isoString);
      setMatchDatetime(isoString);
      setIsEditingDate(false);
      toast.success('Data e hora do próximo racha agendadas!');
    } catch (err) {
      toast.error('Erro ao salvar data: ' + err.message);
    }
    setSavingDate(false);
  };

  const handleStartDraw = () => {
    if (confirmed.length === 0) {
      toast.warning('Selecione pelo menos um jogador para sortear.');
      return;
    }
    navigate('/team-draw', { state: { prefilled: confirmed } });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={22} />
          <span>Próxima Pelada</span>
        </h1>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/more')}>
          <ArrowLeft size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          <span>Voltar</span>
        </button>
      </div>

      {/* Date Configuration Banner */}
      <div className="card" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pelada Agendada para:</div>
            <div style={{ fontWeight: 800, color: 'var(--green-primary)', fontSize: '1.05rem', marginTop: '2px' }}>
              {formatFriendlyDatetime(matchDatetime)}
            </div>
          </div>
          {user && !isEditingDate && (
            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditingDate(true)} style={{ padding: '6px' }}>
              <Pencil size={12} />
            </button>
          )}
        </div>

        {isEditingDate && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
            <input
              type="datetime-local"
              className="form-input"
              value={inputDatetime}
              onChange={e => setInputDatetime(e.target.value)}
              style={{ flex: 1, fontSize: '0.8rem' }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleSaveDate} disabled={savingDate} style={{ padding: '8px' }}>
              <Check size={14} />
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditingDate(false)} style={{ padding: '8px' }}>
              Voltar
            </button>
          </div>
        )}
      </div>

      {/* Attendance Count Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <p className="text-sm text-muted mb-sm" style={{ textAlign: 'center' }}>
          Quem vai jogar no próximo racha? Selecione os confirmados abaixo.
        </p>
        <div className="text-center" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green-primary)' }}>
          {confirmed.length} Confirmado{confirmed.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Players Checklist */}
      <div className="checkbox-list" style={{ marginBottom: '24px', maxHeight: '400px' }}>
        {(players || []).map(p => (
          <label key={p.id} className="checkbox-item" style={{ background: confirmed.includes(p.id) ? 'var(--green-bg)' : undefined }}>
            <input
              type="checkbox"
              checked={confirmed.includes(p.id)}
              onChange={() => togglePresence(p.id)}
            />
            {p.photo ? (
              <img src={p.photo} alt="" className="checkbox-item-photo" />
            ) : (
              <span className="checkbox-item-avatar">{getInitials(p.name)}</span>
            )}
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: confirmed.includes(p.id) ? 600 : 400 }}>{p.nickname || p.name}</span>
              {p.nickname && <div className="text-xs text-muted" style={{ marginTop: '1px' }}>{p.name}</div>}
            </div>
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Save size={16} />
          <span>{saving ? 'Gravando...' : 'Salvar Lista de Confirmados'}</span>
        </button>
        <button className="btn btn-secondary btn-block" onClick={handleStartDraw} disabled={confirmed.length < 2} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
          <Dices size={16} />
          <span>Ir para Sorteio com Confirmados</span>
        </button>
      </div>
    </div>
  );
}
