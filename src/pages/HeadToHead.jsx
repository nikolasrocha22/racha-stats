import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRightLeft, Sparkles, Trophy, Calendar, CircleDot, Info, Swords, ArrowLeft } from 'lucide-react';
import { db, useLiveQuery } from '../db';
import { getAllPlayerStats } from '../utils/stats';
import { getInitials } from '../utils/formatters';
import { comparePlayersAI } from '../ai';

export default function HeadToHead() {
  const navigate = useNavigate();
  const players = useLiveQuery(() => db.players.orderBy('name').toArray());

  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');

  const [h2h, setH2h] = useState(null);
  const [aiReport, setAiReport] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    if (!p1Id || !p2Id || p1Id === p2Id) {
      setH2h(null);
      setAiReport('');
      return;
    }

    const id1 = Number(p1Id);
    const id2 = Number(p2Id);

    (async () => {
      const allMatches = await db.matches.toArray();
      const allLineups = await db.lineups.toArray();
      const allGoals = await db.goals.toArray();

      const commonMatches = [];
      let togetherWins = 0;
      let togetherDraws = 0;
      let togetherLosses = 0;
      let togetherGames = 0;

      let vsGames = 0;
      let p1WinsVs = 0;
      let p2WinsVs = 0;
      let vsDraws = 0;

      for (const m of allMatches) {
        const p1L = allLineups.find(l => l.matchId === m.id && l.playerId === id1);
        const p2L = allLineups.find(l => l.matchId === m.id && l.playerId === id2);

        if (p1L && p2L) {
          const playedTogether = p1L.team === p2L.team;
          const winner = m.scoreA > m.scoreB ? 'A' : m.scoreB > m.scoreA ? 'B' : 'E';

          const p1Team = p1L.team;
          const p2Team = p2L.team;

          const p1Result = winner === 'E' ? 'E' : winner === p1Team ? 'V' : 'D';

          if (playedTogether) {
            togetherGames++;
            if (p1Result === 'V') togetherWins++;
            else if (p1Result === 'E') togetherDraws++;
            else togetherLosses++;
          } else {
            vsGames++;
            if (p1Result === 'V') p1WinsVs++;
            else if (p1Result === 'E') vsDraws++;
            else p2WinsVs++;
          }

          const p1Goals = allGoals.filter(g => g.matchId === m.id && g.scorerId === id1).length;
          const p2Goals = allGoals.filter(g => g.matchId === m.id && g.scorerId === id2).length;

          commonMatches.push({
            match: m,
            together: playedTogether,
            p1Team, p2Team,
            p1Goals, p2Goals
          });
        }
      }

      setH2h({
        togetherGames, togetherWins, togetherDraws, togetherLosses,
        vsGames, p1WinsVs, p2WinsVs, vsDraws,
        commonMatches
      });
    })();
  }, [p1Id, p2Id]);

  const handleAIComparison = async () => {
    if (!p1Id || !p2Id || loadingAI) return;
    setLoadingAI(true);
    setAiReport('');

    try {
      const pl1 = players.find(p => p.id === Number(p1Id));
      const pl2 = players.find(p => p.id === Number(p2Id));

      const allStats = await getAllPlayerStats();
      const s1 = allStats.find(s => s.playerId === pl1.id) || { goals: 0, games: 0, wins: 0, winRate: 50 };
      const s2 = allStats.find(s => s.playerId === pl2.id) || { goals: 0, games: 0, wins: 0, winRate: 50 };

      const res = await comparePlayersAI(pl1, pl2, s1, s2);
      setAiReport(res);
    } catch (err) {
      setAiReport(`❌ Erro ao comparar com IA: ${err.message}`);
    }
    setLoadingAI(false);
  };

  const getPlayer = (id) => players?.find(p => p.id === Number(id));

  const p1 = getPlayer(p1Id);
  const p2 = getPlayer(p2Id);

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowRightLeft size={22} />
          <span>Confronto Direto</span>
        </h1>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/more')}>
          <ArrowLeft size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          <span>Voltar</span>
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <p className="text-xs text-muted mb-md" style={{ textAlign: 'center' }}>
          Compare as estatísticas e histórico de dois jogadores lado a lado.
        </p>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Player 1 Select */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {p1?.photo ? (
              <img src={p1.photo} alt="" className="profile-photo" style={{ width: '64px', height: '64px', margin: '0 0 8px' }} />
            ) : (
              <div className="profile-avatar" style={{ width: '64px', height: '64px', fontSize: '1.2rem', margin: '0 0 8px' }}>
                {p1 ? getInitials(p1.name) : '?'}
              </div>
            )}
            <select className="form-select" value={p1Id} onChange={e => setP1Id(e.target.value)}>
              <option value="">Selecione...</option>
              {(players || []).filter(p => String(p.id) !== p2Id).map(p => (
                <option key={p.id} value={p.id}>{p.nickname || p.name}</option>
              ))}
            </select>
          </div>

          <span className="text-muted" style={{ fontWeight: 800 }}>x</span>

          {/* Player 2 Select */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {p2?.photo ? (
              <img src={p2.photo} alt="" className="profile-photo" style={{ width: '64px', height: '64px', margin: '0 0 8px' }} />
            ) : (
              <div className="profile-avatar" style={{ width: '64px', height: '64px', fontSize: '1.2rem', margin: '0 0 8px' }}>
                {p2 ? getInitials(p2.name) : '?'}
              </div>
            )}
            <select className="form-select" value={p2Id} onChange={e => setP2Id(e.target.value)}>
              <option value="">Selecione...</option>
              {(players || []).filter(p => String(p.id) !== p1Id).map(p => (
                <option key={p.id} value={p.id}>{p.nickname || p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {h2h && p1 && p2 ? (
        <div>
          {/* Versus Stats */}
          <div className="section-title">
            <Swords size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            <span>Jogando um Contra o Outro</span>
          </div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="text-center" style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
              <span className="text-green">{h2h.p1WinsVs}</span>
              <span className="text-muted" style={{ margin: '0 12px', fontSize: '1.2rem' }}>E: {h2h.vsDraws}</span>
              <span className="text-red">{h2h.p2WinsVs}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Vitórias de {p1.nickname || p1.name}</span>
              <span>Total: {h2h.vsGames} jogos</span>
              <span>Vitórias de {p2.nickname || p2.name}</span>
            </div>
          </div>

          {/* Together Stats */}
          <div className="section-title">
            <Trophy size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            <span>Jogando no Mesmo Time</span>
          </div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 0 }}>
              <div className="stat-card" style={{ padding: '8px' }}>
                <div className="stat-card-value">{h2h.togetherGames}</div>
                <div className="stat-card-label" style={{ fontSize: '0.55rem' }}>Jogos</div>
              </div>
              <div className="stat-card" style={{ padding: '8px' }}>
                <div className="stat-card-value text-green">{h2h.togetherWins}</div>
                <div className="stat-card-label" style={{ fontSize: '0.55rem' }}>Vitórias</div>
              </div>
              <div className="stat-card" style={{ padding: '8px' }}>
                <div className="stat-card-value" style={{ color: '#888' }}>{h2h.togetherDraws}</div>
                <div className="stat-card-label" style={{ fontSize: '0.55rem' }}>Empates</div>
              </div>
              <div className="stat-card" style={{ padding: '8px' }}>
                <div className="stat-card-value text-red">{h2h.togetherLosses}</div>
                <div className="stat-card-label" style={{ fontSize: '0.55rem' }}>Derrotas</div>
              </div>
            </div>
            <div className="text-center text-xs text-muted mt-sm">
              Aproveitamento juntos: {h2h.togetherGames > 0 ? Math.round(((h2h.togetherWins * 3 + h2h.togetherDraws) / (h2h.togetherGames * 3)) * 100) : 0}%
            </div>
          </div>

          {/* AI Comparison */}
          <div style={{ marginBottom: '24px' }}>
            {aiReport ? (
              <div className="coach-insights">
                <div className="coach-insights-title">
                  <Sparkles size={14} />
                  <span>Relatório Técnico do Treinador (IA)</span>
                </div>
                <div className="coach-insights-text">
                  {aiReport.split('\n').map((para, i) => {
                    const processBold = (p) => {
                      const parts = [];
                      const regex = /\*\*(.+?)\*\*/g;
                      let lastIndex = 0;
                      let match;
                      while ((match = regex.exec(p)) !== null) {
                        if (match.index > lastIndex) parts.push(p.substring(lastIndex, match.index));
                        parts.push(<strong key={match.index}>{match[1]}</strong>);
                        lastIndex = regex.lastIndex;
                      }
                      if (lastIndex < p.length) parts.push(p.substring(lastIndex));
                      return parts.length > 0 ? parts : p;
                    };
                    return <p key={i} style={{ marginBottom: '8px' }}>{processBold(para)}</p>;
                  })}
                </div>
              </div>
            ) : (
              <button className="btn btn-primary btn-block" onClick={handleAIComparison} disabled={loadingAI}>
                <Sparkles size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                <span>Pedir Análise Tática da IA</span>
              </button>
            )}
          </div>

          {/* Common matches list */}
          {h2h.commonMatches.length > 0 && (
            <>
              <div className="section-title">Histórico de Confrontos</div>
              <div className="matches-list">
                {h2h.commonMatches.map(({ match, together, p1Team, p2Team, p1Goals, p2Goals }) => (
                  <div key={match.id} style={{ position: 'relative' }}>
                    <div className="text-xs" style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2, background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>{together ? '🤝 Juntos' : '⚔️ Rivais'}</span>
                      {(p1Goals > 0 || p2Goals > 0) && (
                        <span>
                          | <CircleDot size={10} style={{ verticalAlign: 'middle', margin: '0 2px' }} />
                          {p1.nickname || p1.name}: {p1Goals} · {p2.nickname || p2.name}: {p2Goals}
                        </span>
                      )}
                    </div>
                    <div className="match-card" onClick={() => navigate(`/matches/${match.id}`)}>
                      <div className="match-card-date" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        <span>{new Date(match.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="match-card-score">
                        <div style={{ flex: 1, textAlign: 'right', fontWeight: p1Team === 'A' ? 700 : 400, color: p1Team === 'A' ? 'var(--green-primary)' : undefined }}>
                          {match.teamAName} ({match.scoreA})
                        </div>
                        <div className="text-muted">x</div>
                        <div style={{ flex: 1, textAlign: 'left', fontWeight: p1Team === 'B' ? 700 : 400, color: p1Team === 'B' ? 'var(--green-primary)' : undefined }}>
                          ({match.scoreB}) {match.teamBName}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        (p1Id && p2Id) && (
          <div className="empty-state">
            <div className="empty-state-icon"><CircleDot size={48} style={{ opacity: 0.5 }} /></div>
            <div className="empty-state-text">Estes jogadores ainda não jogaram nenhuma partida juntos ou contra.</div>
          </div>
        )
      )}
    </div>
  );
}
