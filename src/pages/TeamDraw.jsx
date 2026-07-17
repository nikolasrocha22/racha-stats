import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Share2, Plus, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { db, useLiveQuery } from '../db';
import { getAllPlayerStats } from '../utils/stats';
import { randomDraw } from '../utils/teamBalance';
import { generateBalancedTeams } from '../ai';
import { getInitials } from '../utils/formatters';
import { useToast } from '../components/ToastContext';

// Helper to calculate tactical coordinates on the soccer pitch
function getPlayerCoords(position, index, totalOfPosition, isTeamB) {
  // Normalize position
  const normPos = (position || '').toUpperCase();
  let role = 'MID'; // default

  if (normPos.includes('GOL') || normPos === 'GK' || normPos.includes('GOLEIRO')) {
    role = 'GK';
  } else if (normPos.includes('ZAG') || normPos === 'CB' || normPos.includes('ZAGUEIRO')) {
    role = 'DF';
  } else if (normPos.includes('LAT') || normPos === 'SB' || normPos.includes('LATERAL')) {
    role = 'LAT';
  } else if (normPos.includes('ATA') || normPos.includes('PE') || normPos.includes('PD') || normPos === 'ST' || normPos === 'LW' || normPos === 'RW' || normPos.includes('ATACANTE')) {
    role = 'FW';
  }

  // Base X coordinates
  let pctX = 35; // Default midfield (Time A)
  if (role === 'GK') pctX = 8;
  else if (role === 'DF') pctX = 22;
  else if (role === 'LAT') pctX = 22;
  else if (role === 'MID') pctX = 34;
  else if (role === 'FW') pctX = 44;

  // Flip X coordinate for Team B (right half)
  if (isTeamB) {
    pctX = 100 - pctX;
  }

  // Base Y coordinates (vertical spread)
  let pctY = 50; // Default center
  if (totalOfPosition > 1) {
    const step = 70 / (totalOfPosition - 1 || 1);
    pctY = 15 + index * step;
  } else {
    // If only one, place at specific top/bottom if it's lateral, or center
    if (role === 'LAT') {
      pctY = index === 0 ? 20 : 80;
    } else {
      pctY = 50;
    }
  }

  // Add slight offset for overlap prevention
  return { left: `${pctX}%`, top: `${pctY}%` };
}

export default function TeamDraw() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user } = useOutletContext();
  const players = useLiveQuery(() => db.players.orderBy('name').toArray());
  const restrictions = useLiveQuery(() => db.restrictions.toArray());
  const emailPrefix = user?.email ? user.email.split('@')[0].split('.')[0].toLowerCase().trim() : '';
  const currentPlayer = (players || []).find(p => p.user_id === user?.id) ||
                        (players || []).find(p => (p.nickname || p.name || '').toLowerCase().trim() === emailPrefix) ||
                        (players || []).find(p => (p.nickname || p.name || '').toLowerCase().includes(emailPrefix));
  const currentUserName = currentPlayer ? (currentPlayer.nickname || currentPlayer.name) : null;

  const [selected, setSelected] = useState([]);
  const [prefilledApplied, setPrefilledApplied] = useState(false);

  useEffect(() => {
    if (location.state?.prefilled && !prefilledApplied) {
      setSelected(location.state.prefilled);
      setPrefilledApplied(true);
    }
  }, [location.state, prefilledApplied]);

  const [mode, setMode] = useState('balanced');
  const [extraRules, setExtraRules] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState(null);
  const [revealPhase, setRevealPhase] = useState(0);
  const [revealed, setRevealed] = useState([]);
  const [announcement, setAnnouncement] = useState('');
  const [analysis, setAnalysis] = useState('');

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
    setAnalysis('');

    try {
      let teamA, teamB, ann = '', anl = '', impossible = null;

      if (mode === 'balanced') {
        const allStats = await getAllPlayerStats();
        const statsMap = allStats.reduce((acc, s) => ({ ...acc, [s.playerId]: s }), {});
        const selectedPlayers = (players || []).filter(p => selected.includes(p.id)).map(p => {
          const s = statsMap[p.id] || {};
          return {
            id: p.id,
            name: p.nickname || p.name,
            fullName: p.name,
            position: p.position || 'MEI',
            ovr: s.currentOvr || 60,
            pac: s.pac || 60,
            sho: s.sho || 60,
            pas: s.pas || 60,
            dri: s.dri || 60,
            def: s.def || 60,
            phy: s.phy || 60,
            games: s.games || 0,
            wins: s.wins || 0,
            goals: s.goals || 0,
            assists: s.assists || 0,
            winRate: s.winRate || 50
          };
        });

        const aiResult = await generateBalancedTeams(
          selectedPlayers,
          restrictions || [],
          extraRules,
          currentUserName
        );
        teamA = aiResult.teamA || [];
        teamB = aiResult.teamB || [];
        ann = aiResult.announcement || '';
        anl = aiResult.analysis || '';
        impossible = aiResult.impossible;
      } else {
        const draw = randomDraw(selected);
        teamA = draw.teamA;
        teamB = draw.teamB;
        ann = 'Times sorteados aleatoriamente! Que comece o racha!';
      }

      setResult({ teamA, teamB, impossible });
      setAnnouncement(ann);
      setAnalysis(anl);

      // Start reveal animation phase
      setRevealPhase(1);
      const allCards = [];
      const maxLen = Math.max(teamA.length, teamB.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < teamA.length) allCards.push({ id: teamA[i], team: 'A' });
        if (i < teamB.length) allCards.push({ id: teamB[i], team: 'B' });
      }

      for (let i = 0; i < allCards.length; i++) {
        await new Promise(r => setTimeout(r, 450));
        setRevealed(prev => [...prev, allCards[i]]);
      }

      await new Promise(r => setTimeout(r, 400));
      setRevealPhase(2);
    } catch (err) {
      toast.error('Erro no sorteio: ' + err.message);
    }
    setDrawing(false);
  };

  const getPlayer = (id) => (players || []).find(p => p.id === id);

  const handleShareWhatsApp = () => {
    if (!result) return;
    const formatPlayer = (id) => {
      const player = getPlayer(id);
      return `• ${player?.nickname || player?.name || 'Jogador'}`;
    };
    const teamAText = result.teamA.map(formatPlayer).join('\n');
    const teamBText = result.teamB.map(formatPlayer).join('\n');

    let text = `⚽ *TIMES SORTEADOS - RACHA STATS* ⚽\n\n🟢 *TIME A:*\n${teamAText}\n\n🔴 *TIME B:*\n${teamBText}`;

    if (announcement) {
      const cleanAnn = announcement.replace(/\*\*/g, '*');
      text += `\n\n🎙️ *Análise da IA:*\n${cleanAnn}`;
    }

    if (analysis) {
      text += `\n\n📊 ${analysis.replace(/\*\*/g, '*')}`;
    }

    text += `\n\nMontado em: https://racha-stats.vercel.app`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCreateMatch = () => {
    if (!result) return;
    navigate('/matches/new', {
      state: {
        fromDraw: true,
        lineupA: result.teamA,
        lineupB: result.teamB,
        teamAName: 'Time A',
        teamBName: 'Time B',
        teamAColor: '#2ecc40',
        teamBColor: '#ff4444'
      }
    });
  };

  // Group players by role in each team to calculate offsets
  const getPositionCountsAndIndex = (teamPlayers, playerId) => {
    const list = teamPlayers.map(p => {
      const normPos = (p.position || '').toUpperCase();
      let role = 'MID';
      if (normPos.includes('GOL') || normPos === 'GK' || normPos.includes('GOLEIRO')) role = 'GK';
      else if (normPos.includes('ZAG') || normPos === 'CB' || normPos.includes('ZAGUEIRO')) role = 'DF';
      else if (normPos.includes('LAT') || normPos === 'SB' || normPos.includes('LATERAL')) role = 'LAT';
      else if (normPos.includes('ATA') || normPos.includes('PE') || normPos.includes('PD') || normPos === 'ST' || normPos === 'LW' || normPos === 'RW' || normPos.includes('ATACANTE')) role = 'FW';
      return { id: p.id, role };
    });

    const target = list.find(item => item.id === playerId);
    if (!target) return { index: 0, total: 1 };

    const sameRole = list.filter(item => item.role === target.role);
    const index = sameRole.findIndex(item => item.id === playerId);
    return { index, total: sameRole.length };
  };

  const teamAPlayersEnriched = result ? result.teamA.map(getPlayer).filter(Boolean) : [];
  const teamBPlayersEnriched = result ? result.teamB.map(getPlayer).filter(Boolean) : [];

  return (
    <div className="page">
      <div className="page-header">
        <h1>🎲 Sorteio de Times</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/more')}>← Voltar</button>
      </div>

      {revealPhase === 0 && !result && (
        <>
          {/* Mode */}
          <div className="section-title">Modo</div>
          <div className="tabs" style={{ marginBottom: '16px' }}>
            <button className={`tab ${mode === 'balanced' ? 'active' : ''}`} onClick={() => setMode('balanced')}>
              ⚖️ Equilibrado (IA)
            </button>
            <button className={`tab ${mode === 'random' ? 'active' : ''}`} onClick={() => setMode('random')}>
              🎲 Aleatório
            </button>
          </div>

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
            disabled={drawing || selected.length < 2}>
            {drawing ? (
              <>
                <Sparkles size={16} className="loading-spinner" style={{ marginRight: '6px' }} />
                <span>Sorteando com IA...</span>
              </>
            ) : (
              <>
                <Dices size={16} style={{ marginRight: '6px' }} />
                <span>Sortear! ({selected.length} jogadores)</span>
              </>
            )}
          </button>
        </>
      )}

      {/* Reveal Tactical Soccer Pitch */}
      {revealPhase > 0 && result && (
        <div>
          {revealPhase === 1 && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Sparkles size={16} />
                <span>Escalando os times no campo tático...</span>
              </h2>
            </div>
          )}

          {/* Tactical Pitch Container */}
          <div className="tactical-pitch">
            <div className="pitch-center-line" />
            <div className="pitch-center-circle" />

            {/* Left Half (Team A) */}
            <div className="pitch-half team-a">
              <div className="pitch-goal-area" />
              {revealed.filter(r => r.team === 'A').map(r => {
                const p = getPlayer(r.id);
                if (!p) return null;
                const { index, total } = getPositionCountsAndIndex(teamAPlayersEnriched, p.id);
                const coords = getPlayerCoords(p.position, index, total, false);

                return (
                  <motion.div
                    key={r.id}
                    initial={{ scale: 0, opacity: 0, rotateY: 180 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 180 }}
                    className="pitch-player-node"
                    style={{ left: coords.left, top: coords.top }}
                  >
                    <div className="pitch-player-circle">
                      {getInitials(p.name)}
                    </div>
                    <span className="pitch-player-name">
                      {p.nickname || p.name}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Right Half (Team B) */}
            <div className="pitch-half team-b">
              <div className="pitch-goal-area" />
              {revealed.filter(r => r.team === 'B').map(r => {
                const p = getPlayer(r.id);
                if (!p) return null;
                const { index, total } = getPositionCountsAndIndex(teamBPlayersEnriched, p.id);
                const coords = getPlayerCoords(p.position, index, total, true);

                return (
                  <motion.div
                    key={r.id}
                    initial={{ scale: 0, opacity: 0, rotateY: 180 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 180 }}
                    className="pitch-player-node"
                    style={{ left: coords.left, top: coords.top }}
                  >
                    <div className="pitch-player-circle">
                      {getInitials(p.name)}
                    </div>
                    <span className="pitch-player-name">
                      {p.nickname || p.name}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Teams Header Labels in Pitch context */}
          {revealPhase === 2 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', padding: '0 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="tv-color-dot" style={{ background: '#2ecc40' }} />
                <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--green-primary)' }}>Time A</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--red)' }}>Time B</span>
                <span className="tv-color-dot" style={{ background: '#ff4444' }} />
              </div>
            </div>
          )}

          {/* Announcement */}
          {revealPhase === 2 && announcement && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="ai-summary"
              style={{ marginBottom: '12px' }}
            >
              {announcement}
            </motion.div>
          )}

          {/* AI Analysis */}
          {revealPhase === 2 && analysis && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card"
              style={{ marginBottom: '16px', borderColor: '#223528' }}
            >
              <div className="text-sm" style={{ color: 'var(--green-primary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <Sparkles size={14} />
                <span>Análise Tática</span>
              </div>
              <p className="text-sm" style={{ marginTop: '6px' }}>{analysis}</p>
            </motion.div>
          )}

          {revealPhase === 2 && result.impossible && (
            <div className="card" style={{ borderColor: 'var(--gold-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color="var(--gold)" />
              <p className="text-sm" style={{ margin: 0 }}>{result.impossible}</p>
            </div>
          )}

          {revealPhase === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-primary btn-block" onClick={handleCreateMatch}>
                <Plus size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                <span>Criar Partida com estes Times</span>
              </button>
              <button className="btn btn-secondary btn-block" onClick={handleShareWhatsApp}>
                <Share2 size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                <span>Compartilhar no WhatsApp</span>
              </button>
              <button className="btn btn-secondary btn-block" onClick={() => {
                setResult(null);
                setRevealPhase(0);
                setRevealed([]);
                setAnnouncement('');
                setAnalysis('');
              }}>
                <RefreshCw size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                <span>Novo Sorteio</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
