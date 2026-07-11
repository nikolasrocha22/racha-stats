import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router';
import { db, useLiveQuery, addMatch, updateMatch, getMatchDetails } from '../db';
import { TEAM_COLORS, getInitials } from '../utils/formatters';

const TOTAL_STEPS = 6;

export default function MatchForm() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [location, setLocation] = useState('');

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

  // Load existing match for edit
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (isEdit && !loaded) {
      getMatchDetails(Number(id)).then(m => {
        if (!m) return;
        setDate(m.date || '');
        setLocation(m.location || '');
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

  const togglePlayer = (playerId, team) => {
    if (team === 'A') {
      if (lineupA.includes(playerId)) setLineupA(lineupA.filter(i => i !== playerId));
      else {
        setLineupA([...lineupA, playerId]);
        setLineupB(lineupB.filter(i => i !== playerId));
      }
    } else {
      if (lineupB.includes(playerId)) setLineupB(lineupB.filter(i => i !== playerId));
      else {
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
      date, location,
      teamAName, teamAColor, teamBName, teamBColor,
      scoreA, scoreB,
      lineupA, lineupB,
      goals: goals.filter(g => g.scorerId),
      aiSummary: ''
    };
    try {
      if (isEdit) {
        await updateMatch(Number(id), data);
        navigate(`/matches/${id}`);
      } else {
        const newId = await addMatch(data);
        navigate(`/matches/${newId}`);
      }
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEdit ? '✏️ Editar Partida' : '⚽ Nova Partida'}</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Voltar</button>
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
          <h3 style={{ marginBottom: '16px' }}>📅 Quando e onde?</h3>
          <div className="form-group">
            <label className="form-label">Data da partida *</label>
            <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Local (opcional)</label>
            <input className="form-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Quadra do Sesc, Campo do Bairro..." />
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
          <div className="card">
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
          <h3 style={{ marginBottom: '16px' }}>📋 Escalação</h3>

          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            <div style={{ flex: 1, textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: teamAColor }}>
              {teamAName} ({lineupA.length})
            </div>
            <div style={{ width: '40px' }} />
            <div style={{ flex: 1, textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: teamBColor }}>
              {teamBName} ({lineupB.length})
            </div>
          </div>

          {(players || []).length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-text">Nenhum jogador cadastrado.</div>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/players/new')}>+ Cadastrar Jogador</button>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {(players || []).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <button
                    className={`btn btn-sm ${lineupA.includes(p.id) ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, fontSize: '0.75rem', borderColor: lineupA.includes(p.id) ? teamAColor : undefined, background: lineupA.includes(p.id) ? teamAColor : undefined }}
                    onClick={() => togglePlayer(p.id, 'A')}
                  >
                    {lineupA.includes(p.id) ? '✓' : ''}
                  </button>
                  <div style={{ flex: 2, textAlign: 'center', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    {p.photo ? (
                      <img src={p.photo} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <span className="checkbox-item-avatar" style={{ width: '24px', height: '24px', fontSize: '0.5rem' }}>{getInitials(p.name)}</span>
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.nickname || p.name}
                    </span>
                  </div>
                  <button
                    className={`btn btn-sm ${lineupB.includes(p.id) ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, fontSize: '0.75rem', borderColor: lineupB.includes(p.id) ? teamBColor : undefined, background: lineupB.includes(p.id) ? teamBColor : undefined }}
                    onClick={() => togglePlayer(p.id, 'B')}
                  >
                    {lineupB.includes(p.id) ? '✓' : ''}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Score */}
      {step === 4 && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>🥅 Placar Final</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '20px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: teamAColor, marginBottom: '8px' }}>{teamAName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button className="btn btn-icon" onClick={() => setScoreA(Math.max(0, scoreA - 1))}>−</button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '3rem', fontWeight: 700, minWidth: '60px', textAlign: 'center' }}>{scoreA}</span>
                <button className="btn btn-icon" onClick={() => setScoreA(scoreA + 1)}>+</button>
              </div>
            </div>
            <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>✕</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: teamBColor, marginBottom: '8px' }}>{teamBName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button className="btn btn-icon" onClick={() => setScoreB(Math.max(0, scoreB - 1))}>−</button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '3rem', fontWeight: 700, minWidth: '60px', textAlign: 'center' }}>{scoreB}</span>
                <button className="btn btn-icon" onClick={() => setScoreB(scoreB + 1)}>+</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Goals */}
      {step === 5 && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>⚽ Gols da Partida</h3>
          <p className="text-sm text-muted mb-md">Registre quem marcou cada gol e quem deu a assistência (opcional).</p>

          {goals.map((goal, idx) => (
            <div key={idx} className="card" style={{ marginBottom: '12px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Gol #{idx + 1}</span>
                <button className="btn btn-danger btn-sm" onClick={() => removeGoal(idx)} style={{ padding: '4px 8px', fontSize: '0.7rem' }}>✕</button>
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label">Time</label>
                <select className="form-select" value={goal.team} onChange={e => updateGoal(idx, 'team', e.target.value)}>
                  <option value="A">{teamAName}</option>
                  <option value="B">{teamBName}</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label">Autor do gol</label>
                <select className="form-select" value={goal.scorerId || ''} onChange={e => updateGoal(idx, 'scorerId', Number(e.target.value) || null)}>
                  <option value="">Selecione...</option>
                  {(goal.team === 'A' ? teamAPlayers : teamBPlayers).map(p => (
                    <option key={p.id} value={p.id}>{p.nickname || p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assistência (opcional)</label>
                <select className="form-select" value={goal.assistId || ''} onChange={e => updateGoal(idx, 'assistId', Number(e.target.value) || null)}>
                  <option value="">Nenhuma</option>
                  {(goal.team === 'A' ? teamAPlayers : teamBPlayers).filter(p => p.id !== goal.scorerId).map(p => (
                    <option key={p.id} value={p.id}>{p.nickname || p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          <button className="btn btn-secondary btn-block" onClick={addGoal}>+ Adicionar Gol</button>
        </div>
      )}

      {/* Step 6: Confirmation */}
      {step === 6 && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>✅ Confirmar Partida</h3>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="text-sm text-muted mb-sm">📅 {date} {location && `• 📍 ${location}`}</div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: teamAColor }}>{teamAName}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700 }}>{scoreA}</div>
                <div className="text-xs text-muted">{lineupA.length} jogadores</div>
              </div>
              <span className="text-muted">✕</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: teamBColor }}>{teamBName}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700 }}>{scoreB}</div>
                <div className="text-xs text-muted">{lineupB.length} jogadores</div>
              </div>
            </div>
            {goals.length > 0 && (
              <div className="text-sm text-muted" style={{ textAlign: 'center' }}>
                ⚽ {goals.filter(g => g.scorerId).length} gol(s) registrado(s)
              </div>
            )}
          </div>

          <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : '✓ Registrar Partida')}
          </button>
        </div>
      )}

      {/* Navigation buttons */}
      {step < 6 && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          {step > 1 && (
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(step - 1)}>← Anterior</button>
          )}
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(step + 1)} disabled={!canNext()}>
            Próximo →
          </button>
        </div>
      )}
      {step === 6 && step > 1 && (
        <button className="btn btn-secondary btn-block" style={{ marginTop: '12px' }} onClick={() => setStep(step - 1)}>
          ← Anterior
        </button>
      )}
    </div>
  );
}
