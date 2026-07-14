import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext, useLocation } from 'react-router';
import { Calendar, Pencil, ArrowLeft, CircleDot, Save, Plus, Trash2, MapPin } from 'lucide-react';
import { db, useLiveQuery, addMatch, updateMatch, getMatchDetails } from '../db';
import { TEAM_COLORS, getInitials } from '../utils/formatters';
import { useToast } from '../components/ToastContext';

const TOTAL_STEPS = 6;

export default function MatchForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user } = useOutletContext();
  const isEdit = !!id;

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const players = useLiveQuery(() => db.players.orderBy('name').toArray());

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Date & Location
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [locationField, setLocationField] = useState('');

  // Step 2: Teams
  const [teamAName, setTeamAName] = useState('Time A');
  const [teamAColor, setTeamAColor] = useState('#2ecc40');
  const [teamBName, setTeamBName] = useState('Time B');
  const [teamBColor, setTeamBColor] = useState('#ff4444');

  // Step 3: Lineups
  const [lineupA, setLineupA] = useState([]);
  const [lineupB, setLineupB] = useState([]);

  // Step 4: Score
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  // Step 5: Goals
  const [goals, setGoals] = useState([]);

  // Pre-fill from TeamDraw (Sorteio → Partida)
  const [drawApplied, setDrawApplied] = useState(false);
  useEffect(() => {
    if (!isEdit && !drawApplied && location.state?.fromDraw) {
      const s = location.state;
      if (s.lineupA) setLineupA(s.lineupA);
      if (s.lineupB) setLineupB(s.lineupB);
      if (s.teamAName) setTeamAName(s.teamAName);
      if (s.teamBName) setTeamBName(s.teamBName);
      if (s.teamAColor) setTeamAColor(s.teamAColor);
      if (s.teamBColor) setTeamBColor(s.teamBColor);
      setDrawApplied(true);
      // Skip directly to step 4 (score) as lineups are pre-filled
      setStep(4);
    }
  }, [isEdit, drawApplied, location.state]);

  // Load existing match for edit
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (isEdit && !loaded) {
      getMatchDetails(Number(id)).then(m => {
        if (!m) return;
        setDate(m.date || '');
        setLocationField(m.location || '');
        setTeamAName(m.teamAName || 'Time A');
        setTeamAColor(m.teamAColor || '#2ecc40');
        setTeamBName(m.teamBName || 'Time B');
        setTeamBColor(m.teamBColor || '#ff4444');
        setLineupA(m.lineupA?.map(p => p.id) || []);
        setLineupB(m.lineupB?.map(p => p.id) || []);
        setScoreA(m.scoreA || 0);
        setScoreB(m.scoreB || 0);
        setGoals(m.goals?.map(g => ({ scorerId: g.scorerId, assistId: g.assistId, team: g.team })) || []);
        setLoaded(true);
      });
    }
  }, [isEdit, id, loaded]);

  const toggleLineup = (playerId, team) => {
    if (team === 'A') {
      if (lineupA.includes(playerId)) {
        setLineupA(lineupA.filter(i => i !== playerId));
      } else {
        setLineupA([...lineupA, playerId]);
        setLineupB(lineupB.filter(i => i !== playerId));
      }
    } else {
      if (lineupB.includes(playerId)) {
        setLineupB(lineupB.filter(i => i !== playerId));
      } else {
        setLineupB([...lineupB, playerId]);
        setLineupA(lineupA.filter(i => i !== playerId));
      }
    }
  };

  const addGoal = () => {
    setGoals([...goals, { scorerId: null, assistId: null, team: 'A' }]);
  };

  const updateGoal = (idx, field, value) => {
    const updated = [...goals];
    updated[idx] = { ...updated[idx], [field]: value };
    setGoals(updated);
  };

  const removeGoal = (idx) => {
    setGoals(goals.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      date, location: locationField,
      teamAName, teamAColor, teamBName, teamBColor,
      scoreA, scoreB,
      lineupA, lineupB,
      goals: goals.filter(g => g.scorerId),
      aiSummary: ''
    };
    try {
      if (isEdit) {
        await updateMatch(Number(id), data);
        toast.success('Partida atualizada com sucesso!');
        navigate(`/matches/${id}`);
      } else {
        const newId = await addMatch(data);
        toast.success('Partida registrada com sucesso!');
        navigate(`/matches/${newId}`);
      }
    } catch (err) {
      toast.error('Erro ao salvar partida: ' + err.message);
      setSaving(false);
    }
  };

  const canNext = () => {
    switch (step) {
      case 1: return !!date;
      case 2: return teamAName.trim() && teamBName.trim();
      case 3: return lineupA.length > 0 && lineupB.length > 0;
      case 4: return true;
      case 5: return true;
      case 6: return true;
      default: return true;
    }
  };

  const teamAPlayers = (players || []).filter(p => lineupA.includes(p.id));
  const teamBPlayers = (players || []).filter(p => lineupB.includes(p.id));
  const expectedGoals = scoreA + scoreB;
  const registeredGoals = goals.filter(g => g.scorerId).length;
  const hasGoalMismatch = expectedGoals !== registeredGoals;

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isEdit ? <Pencil size={22} /> : <CircleDot size={22} />}
          <span>{isEdit ? 'Editar Partida' : 'Nova Partida'}</span>
        </h1>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          <span>Voltar</span>
        </button>
      </div>

      {/* Steps indicator */}
      <div className="steps">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div key={i} className={`step-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'completed' : ''}`} />
        ))}
      </div>

      {/* Step 1: Date & Location */}
      {step === 1 && (
        <div>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={18} />
            <span>Quando e onde?</span>
          </h3>
          <div className="form-group">
            <label className="form-label">Data da partida *</label>
            <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Local (opcional)</label>
            <input className="form-input" value={locationField} onChange={e => setLocationField(e.target.value)} placeholder="Ex: Quadra do Sesc, Campo do Bairro..." />
          </div>
        </div>
      )}

      {/* Step 2: Teams */}
      {step === 2 && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>🏟️ Times</h3>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Nome do Time A</label>
              <input className="form-input" value={teamAName} onChange={e => setTeamAName(e.target.value)} />
            </div>
            <label className="form-label">Cor do Time A</label>
            <div className="color-picker">
              {TEAM_COLORS.map(c => (
                <div key={c} className={`color-swatch ${teamAColor === c ? 'active' : ''}`}
                  style={{ background: c }} onClick={() => setTeamAColor(c)} />
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Nome do Time B</label>
              <input className="form-input" value={teamBName} onChange={e => setTeamBName(e.target.value)} />
            </div>
            <label className="form-label">Cor do Time B</label>
            <div className="color-picker">
              {TEAM_COLORS.map(c => (
                <div key={c} className={`color-swatch ${teamBColor === c ? 'active' : ''}`}
                  style={{ background: c }} onClick={() => setTeamBColor(c)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Lineups */}
      {step === 3 && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>👥 Escalar Jogadores</h3>
          <p className="text-xs text-muted mb-md">Selecione o time de cada jogador presente.</p>

          <div className="checkbox-list" style={{ maxHeight: '350px' }}>
            {(players || []).map(p => {
              const inA = lineupA.includes(p.id);
              const inB = lineupB.includes(p.id);
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderBottom: '1px solid var(--border)' }}>
                  {p.photo ? (
                    <img src={p.photo} alt="" className="checkbox-item-photo" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                  ) : (
                    <span className="checkbox-item-avatar" style={{ width: '28px', height: '28px', fontSize: '0.6rem' }}>{getInitials(p.name)}</span>
                  )}
                  <span className="text-sm" style={{ flex: 1 }}>{p.nickname || p.name}</span>
                  <button className={`btn btn-sm ${inA ? 'btn-primary' : 'btn-secondary'}`} onClick={() => toggleLineup(p.id, 'A')} style={{ color: inA ? '#000' : undefined }}>
                    A
                  </button>
                  <button className={`btn btn-sm ${inB ? 'btn-danger' : 'btn-secondary'}`} onClick={() => toggleLineup(p.id, 'B')} style={{ background: inB ? 'var(--red)' : undefined, color: inB ? '#fff' : undefined }}>
                    B
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Score */}
      {step === 4 && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>🔢 Qual foi o placar?</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', margin: '24px 0' }}>
            <div style={{ textSelf: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: teamAColor, marginBottom: '6px' }}>{teamAName}</div>
              <input type="number" min="0" className="form-input" value={scoreA} onChange={e => setScoreA(Math.max(0, Number(e.target.value)))} style={{ width: '80px', fontSize: '1.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }} />
            </div>
            <span className="text-muted" style={{ fontSize: '1.2rem', fontWeight: 800 }}>x</span>
            <div style={{ textSelf: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: teamBColor, marginBottom: '6px' }}>{teamBName}</div>
              <input type="number" min="0" className="form-input" value={scoreB} onChange={e => setScoreB(Math.max(0, Number(e.target.value)))} style={{ width: '80px', fontSize: '1.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Goals */}
      {step === 5 && (
        <div>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CircleDot size={18} />
            <span>Gols da Partida</span>
          </h3>
          <p className="text-xs text-muted mb-md">Registre os autores dos gols e assistências para atualizar as estatísticas (opcional).</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', maxHeight: '300px', overflowY: 'auto' }}>
            {goals.map((g, idx) => (
              <div key={idx} className="card" style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="text-sm font-semibold">Gol #{idx + 1}</span>
                  <button className="btn btn-danger btn-sm" onClick={() => removeGoal(idx)} style={{ padding: '2px 6px' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button className={`btn btn-sm ${g.team === 'A' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => updateGoal(idx, 'team', 'A')} style={{ flex: 1, color: g.team === 'A' ? '#000' : undefined }}>
                    {teamAName}
                  </button>
                  <button className={`btn btn-sm ${g.team === 'B' ? 'btn-danger' : 'btn-secondary'}`} onClick={() => updateGoal(idx, 'team', 'B')} style={{ flex: 1, background: g.team === 'B' ? 'var(--red)' : undefined, color: g.team === 'B' ? '#fff' : undefined }}>
                    {teamBName}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select className="form-select" value={g.scorerId || ''} onChange={e => updateGoal(idx, 'scorerId', e.target.value ? Number(e.target.value) : null)} style={{ flex: 1, fontSize: '0.8rem' }}>
                    <option value="">Autor do Gol *</option>
                    {(g.team === 'A' ? teamAPlayers : teamBPlayers).map(p => (
                      <option key={p.id} value={p.id}>{p.nickname || p.name}</option>
                    ))}
                  </select>
                  <select className="form-select" value={g.assistId || ''} onChange={e => updateGoal(idx, 'assistId', e.target.value ? Number(e.target.value) : null)} style={{ flex: 1, fontSize: '0.8rem' }}>
                    <option value="">Assistência (opcional)</option>
                    {(g.team === 'A' ? teamAPlayers : teamBPlayers).filter(p => p.id !== g.scorerId).map(p => (
                      <option key={p.id} value={p.id}>{p.nickname || p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-secondary btn-block" onClick={addGoal}>
            <Plus size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            <span>Adicionar Gol</span>
          </button>
        </div>
      )}

      {/* Step 6: Confirmation */}
      {step === 6 && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>Confirmar Partida</h3>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="text-sm text-muted mb-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={14} />
              <span>{date}</span>
              {locationField && (
                <>
                  <MapPin size={14} />
                  <span>{locationField}</span>
                </>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: teamAColor }}>{teamAName}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700 }}>{scoreA}</div>
                <div className="text-xs text-muted">{lineupA.length} jogadores</div>
              </div>
              <span className="text-muted">x</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: teamBColor }}>{teamBName}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700 }}>{scoreB}</div>
                <div className="text-xs text-muted">{lineupB.length} jogadores</div>
              </div>
            </div>
            {goals.length > 0 && (
              <div className="text-sm text-muted" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <CircleDot size={14} />
                <span>{goals.filter(g => g.scorerId).length} gol(s) registrado(s)</span>
              </div>
            )}
            {hasGoalMismatch && (
              <div className="card text-sm" style={{ marginTop: '12px', background: 'rgba(255, 136, 0, 0.08)', borderColor: 'rgba(255, 136, 0, 0.35)', color: 'var(--orange)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertTriangleIcon size={18} style={{ flexShrink: 0 }} />
                <span>O placar tem {expectedGoals} gol(s), mas você registrou {registeredGoals}. Você ainda pode salvar, mas os rankings de artilharia e assistência vão usar apenas os gols registrados.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
        {step > 1 && (
          <button className="btn btn-secondary" onClick={() => setStep(step - 1)} style={{ flex: 1 }}>
            Anterior
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button className="btn btn-primary" onClick={() => setStep(step + 1)} disabled={!canNext()} style={{ flex: 2 }}>
            Avançar
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 2, display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
            <Save size={16} />
            <span>{saving ? 'Salvando...' : 'Salvar Partida'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

function AlertTriangleIcon({ size = 16, color = 'var(--orange)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
