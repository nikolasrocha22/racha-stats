import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { Settings as SettingsIcon, ArrowLeft, Cpu, Sparkles, Plus, X, Download, Upload, Info } from 'lucide-react';
import { db, useLiveQuery, addRestriction, deleteRestriction, exportAllData, importAllData } from '../db';
import { useToast } from '../components/ToastContext';

export default function Settings() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAdmin } = useOutletContext();

  // Protect Settings page
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const players = useLiveQuery(() => db.players.toArray());
  const restrictions = useLiveQuery(() => db.restrictions.toArray());

  const [newRestrA, setNewRestrA] = useState('');
  const [newRestrB, setNewRestrB] = useState('');
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `racha-stats-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup exportado com sucesso!');
    } catch (err) {
      toast.error('Erro ao exportar backup: ' + err.message);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm('⚠️ Isso vai SUBSTITUIR todos os dados atuais. Tem certeza?')) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importAllData(data);
      toast.success('Dados importados com sucesso!');
      window.location.reload();
    } catch (err) {
      toast.error('Erro ao importar: ' + err.message);
    }
    setImporting(false);
  };

  const handleAddRestriction = async () => {
    if (!newRestrA || !newRestrB || newRestrA === newRestrB) return;
    try {
      await addRestriction(Number(newRestrA), Number(newRestrB));
      toast.success('Restrição adicionada com sucesso!');
      setNewRestrA('');
      setNewRestrB('');
    } catch (err) {
      toast.error('Erro ao adicionar restrição: ' + err.message);
    }
  };

  const handleDeleteRestriction = async (id) => {
    try {
      await deleteRestriction(id);
      toast.success('Restrição removida!');
    } catch (err) {
      toast.error('Erro ao remover: ' + err.message);
    }
  };

  const getPlayerName = (id) => {
    const p = (players || []).find(p => p.id === id);
    return p?.nickname || p?.name || 'Desconhecido';
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingsIcon size={22} />
          <span>Configurações</span>
        </h1>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          <span>Voltar</span>
        </button>
      </div>

      {/* AI Status */}
      <div className="section-title">🤖 Inteligência Artificial</div>
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--green-primary)', display: 'flex', alignItems: 'center' }}><Cpu size={32} /></span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>IA Configurada no Servidor</div>
            <p className="text-xs text-muted" style={{ marginTop: '4px' }}>
              Modelo: NVIDIA Nemotron Super 49B · A chave da API está configurada no servidor — todos os usuários podem usar as features de IA automaticamente.
            </p>
          </div>
        </div>
        <div className="text-xs text-muted" style={{ marginTop: '12px', padding: '8px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={12} color="var(--gold)" />
          <span>Resumo de partida · Sorteio equilibrado · Chat de stats · Títulos de jogadores</span>
        </div>
      </div>

      {/* Restrictions */}
      <div className="section-title">🚫 Restrições de Sorteio</div>
      <div className="card" style={{ marginBottom: '24px' }}>
        <p className="text-xs text-muted mb-md">Duplas que NÃO podem ficar no mesmo time no sorteio.</p>

        {(restrictions || []).map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm">🚫 {getPlayerName(r.playerAId)} + {getPlayerName(r.playerBId)}</span>
            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRestriction(r.id)} style={{ padding: '4px 8px' }}>
              <X size={12} />
            </button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <select className="form-select" value={newRestrA} onChange={e => setNewRestrA(e.target.value)} style={{ flex: 1 }}>
            <option value="">Jogador 1</option>
            {(players || []).map(p => <option key={p.id} value={p.id}>{p.nickname || p.name}</option>)}
          </select>
          <select className="form-select" value={newRestrB} onChange={e => setNewRestrB(e.target.value)} style={{ flex: 1 }}>
            <option value="">Jogador 2</option>
            {(players || []).filter(p => String(p.id) !== newRestrA).map(p => <option key={p.id} value={p.id}>{p.nickname || p.name}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={handleAddRestriction}
            disabled={!newRestrA || !newRestrB}>
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Export/Import */}
      <div className="section-title">💾 Dados</div>
      <div className="card" style={{ marginBottom: '24px' }}>
        <p className="text-xs text-muted mb-md">Exporte seus dados como JSON para backup ou transfira para outro navegador.</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={handleExport}>
            <Download size={14} />
            <span>Exportar</span>
          </button>
          <label className="btn btn-secondary" style={{ flex: 1, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
            <Upload size={14} />
            <span>Importar</span>
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} disabled={importing} />
          </label>
        </div>
      </div>

      {/* About */}
      <div className="section-title">ℹ️ Sobre</div>
      <div className="card">
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--green-primary)', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><Info size={32} /></div>
          <h3>Racha Stats</h3>
          <p className="text-sm text-muted">O histórico oficial das suas peladas</p>
          <p className="text-xs text-muted mt-sm">v2.0.0 • Dados no Supabase • IA NVIDIA Nemotron</p>
        </div>
      </div>
    </div>
  );
}
