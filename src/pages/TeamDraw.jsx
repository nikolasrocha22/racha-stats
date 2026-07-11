import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../db';
import { getAllPlayerStats } from '../utils/stats';
import { randomDraw } from '../utils/teamBalance';
import { isAIConfigured, generateBalancedTeams } from '../ai';
import { getInitials } from '../utils/formatters';

export default function TeamDraw() {
  const navigate = useNavigate();
  const players = useLiveQuery(() => db.players.orderBy('name').toArray());
  const restrictions = useLiveQuery(() => db.restrictions.toArray());

  const [selected, setSelected] = useState([]);
  const [mode, setMode] = useState('random');
  const [extraRules, setExtraRules] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState(null);
  const [revealPhase, setRevealPhase] = useState(0); // 0=not started, 1=revealing, 2=done
  const [revealed, setRevealed] = useState([]);
  const [announcement, setAnnouncement] = useState('');

  const togglePlayer = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selected.length === (players?.length || 0)) setSelected([]);
    else setSelected((players || []).map(p => p.id));
  };

  const handleDraw = async () => {
    if (selected.length < 2) return;
    setDrawing(true);
    setResult(null);
    setRevealPhase(0);
    setRevealed([]);
    setAnnouncement('');

    try {
      let teamA, teamB, ann = '', impossible = null;

      if (mode === 'balanced' && isAIConfigured()) {
        const allStats = await getAllPlayerStats();
        const statsMap = allStats.reduce((acc, s) => ({ ...acc, [s.playerId]: s }), {});
        const selectedPlayers = (players || []).filter(p => selected.includes(p.id)).map(p => ({
          id: p.id, name: p.nickname || p.name, ...statsMap[p.id]
        }));

        const aiResult = await generateBalancedTeams(
          selectedPlayers,
          selectedPlayers.map(p => ({ id: p.id, goals: p.goals || 0, games: p.games || 0, winRate: p.winRate || 50 })),
          restrictions || [],
          extraRules
        );
        teamA = aiResult.teamA || [];
        teamB = aiResult.teamB || [];
        ann = aiResult.announcement || '';
        impossible = aiResult.impossible;
      } else {
        const draw = randomDraw(selected);
        teamA = draw.teamA;
        teamB = draw.teamB;
        ann = '🎲 Times sorteados aleatoriamente! Que comece o jogo!';
      }

      setResult({ teamA, teamB, impossible });
      setAnnouncement(ann);

      // Start reveal animation
      setRevealPhase(1);
      const allCards = [];
      const maxLen = Math.max(teamA.length, teamB.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < teamA.length) allCards.push({ id: teamA[i], team: 'A' });
        if (i < teamB.length) allCards.push({ id: teamB[i], team: 'B' });
      }

      for (let i = 0; i < allCards.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        setRevealed(prev => [...prev, allCards[i]]);
      }

      await new Promise(r => setTimeout(r, 500));
      setRevealPhase(2);
    } catch (err) {
      alert('Erro no sorteio: ' + err.message);
    }
    setDrawing(false);
  };

  const getPlayer = (id) => (players || []).find(p => p.id === id);

  return (
    <div className="page">
      <div className="page-header">
        <h1>🎲 Sorteio de Times</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Voltar</button>
      </div>

      {revealPhase === 0 && !result && (
        <>
          {/* Mode */}
          <div className="section-title">Modo</div>
          <div className="tabs" style={{ marginBottom: '16px' }}>
            <button className={`tab ${mode === 'random' ? 'active' : ''}`} onClick={() => setMode('random')}>
              🎲 Aleatório
            </button>
            <button className={`tab ${mode === 'balanced' ? 'active' : ''}`} onClick={() => setMode('balanced')}>
              ⚖️ Equilibrado (IA)
            </button>
          </div>

          {mode === 'balanced' && !isAIConfigured() && (
            <div className="card" style={{ marginBottom: '16px', borderColor: 'var(--gold-dark)' }}>
              <p className="text-sm">⚠️ Configure a API key do Gemini nas <b>Configurações</b> para usar o modo equilibrado.</p>
            </div>
          )}

          {/* Player selection */}
          <div className="section-title">Jogadores Presentes ({selected.length})</div>
          <button className="btn btn-secondary btn-sm mb-md" onClick={selectAll}>
            {selected.length === (players?.length || 0) ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </button>

          <div className="checkbox-list" style={{ marginBottom: '16px' }}>
            {(players || []).map(p => (
              <label key={p.id} className="checkbox-item">
                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => togglePlayer(p.id)} />
                {p.photo ? (
                  <img src={p.photo} alt="" className="checkbox-item-photo" />
                ) : (
                  <span className="checkbox-item-avatar">{getInitials(p.name)}</span>
                )}
                <span>{p.nickname || p.name}</span>
              </label>
            ))}
          </div>

          {/* Extra rules */}
          {mode === 'balanced' && (
            <div className="form-group">
              <label className="form-label">Regras extras (linguagem natural, opcional)</label>
              <textarea className="form-textarea" value={extraRules} onChange={e => setExtraRules(e.target.value)}
                placeholder='Ex: "João e Pedro não podem ficar juntos", "Equilibrar goleiros nos dois times"...' />
            </div>
          )}

          <button className="btn btn-primary btn-block" onClick={handleDraw}
            disabled={drawing || selected.length < 2 || (mode === 'balanced' && !isAIConfigured())}>
            {drawing ? '✨ Sorteando...' : `🎲 Sortear! (${selected.length} jogadores)`}
          </button>
        </>
      )}

      {/* Reveal Animation */}
      {revealPhase > 0 && result && (
        <div>
          {revealPhase === 1 && (
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <motion.h2
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{ fontSize: '1.3rem', color: 'var(--gold)' }}>
                🎬 Revelando os times...
              </motion.h2>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {/* Team A */}
            <div>
              <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', color: 'var(--green-primary)', marginBottom: '12px' }}>
                🟢 Time A
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <AnimatePresence>
                  {revealed.filter(r => r.team === 'A').map(r => {
                    const p = getPlayer(r.id);
                    if (!p) return null;
                    return (
                      <motion.div
                        key={r.id}
                        initial={{ rotateY: 180, opacity: 0, scale: 0.5 }}
                        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                        className="player-card"
                        style={{ width: '100%', maxWidth: '140px', padding: '10px', margin: 0 }}
                      >
                        {p.photo ? (
                          <div className="player-card-photo" style={{ width: '48px', height: '48px' }}>
                            <img src={p.photo} alt={p.name} />
                          </div>
                        ) : (
                          <div className="player-card-avatar" style={{ width: '48px', height: '48px', fontSize: '1rem' }}>
                            {getInitials(p.name)}
                          </div>
                        )}
                        <div className="player-card-name" style={{ fontSize: '0.75rem' }}>
                          {p.nickname || p.name}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Team B */}
            <div>
              <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', color: 'var(--red)', marginBottom: '12px' }}>
                🔴 Time B
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <AnimatePresence>
                  {revealed.filter(r => r.team === 'B').map(r => {
                    const p = getPlayer(r.id);
                    if (!p) return null;
                    return (
                      <motion.div
                        key={r.id}
                        initial={{ rotateY: 180, opacity: 0, scale: 0.5 }}
                        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                        className="player-card"
                        style={{ width: '100%', maxWidth: '140px', padding: '10px', margin: 0 }}
                      >
                        {p.photo ? (
                          <div className="player-card-photo" style={{ width: '48px', height: '48px' }}>
                            <img src={p.photo} alt={p.name} />
                          </div>
                        ) : (
                          <div className="player-card-avatar" style={{ width: '48px', height: '48px', fontSize: '1rem' }}>
                            {getInitials(p.name)}
                          </div>
                        )}
                        <div className="player-card-name" style={{ fontSize: '0.75rem' }}>
                          {p.nickname || p.name}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Announcement */}
          {revealPhase === 2 && announcement && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="ai-summary"
              style={{ marginBottom: '16px' }}
            >
              {announcement}
            </motion.div>
          )}

          {revealPhase === 2 && result.impossible && (
            <div className="card" style={{ borderColor: 'var(--gold-dark)', marginBottom: '16px' }}>
              <p className="text-sm">⚠️ {result.impossible}</p>
            </div>
          )}

          {revealPhase === 2 && (
            <button className="btn btn-primary btn-block" onClick={() => {
              setResult(null);
              setRevealPhase(0);
              setRevealed([]);
              setAnnouncement('');
            }}>
              🔄 Novo Sorteio
            </button>
          )}
        </div>
      )}
    </div>
  );
}
