import React from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { db, useLiveQuery } from '../db';
import { getCraqueDaRodada, getAllPlayerStats } from '../utils/stats';
import MatchCard from '../components/MatchCard';
import { getInitials } from '../utils/formatters';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const matches = useLiveQuery(() => db.matches.orderBy('date').reverse().limit(5).toArray());
  const players = useLiveQuery(() => db.players.toArray());
  const allGoals = useLiveQuery(() => db.goals.toArray());
  const [craque, setCraque] = React.useState(null);

  const [highlights, setHighlights] = React.useState({
    artilheiro: null,
    garcom: null,
    muralha: null,
    pernaDePau: null
  });

  React.useEffect(() => {
    getCraqueDaRodada().then(setCraque);
  }, [matches]);

  React.useEffect(() => {
    getAllPlayerStats().then(allStats => {
      if (!allStats || allStats.length === 0) return;

      const artilheiro = [...allStats]
        .filter(s => s.goals > 0)
        .sort((a, b) => b.goals - a.goals)[0] || null;

      const garcom = [...allStats]
        .filter(s => s.assists > 0)
        .sort((a, b) => b.assists - a.assists)[0] || null;

      const muralha = [...allStats]
        .filter(s => s.games >= 3 && s.winRate > 0)
        .sort((a, b) => b.winRate - a.winRate)[0] || null;

      const pernaDePau = [...allStats]
        .filter(s => s.losses > 0)
        .sort((a, b) => b.losses - a.losses)[0] || null;

      setHighlights({ artilheiro, garcom, muralha, pernaDePau });
    });
  }, [players]);

  const totalMatches = matches?.length || 0;
  const totalPlayers = players?.length || 0;
  const totalGoals = allGoals?.length || 0;

  return (
    <div className="page">
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>
          ⚽ Racha Stats
        </h1>
        <p className="text-muted text-sm">O histórico oficial das peladas</p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-value">{totalMatches}</div>
          <div className="stat-card-label">Partidas</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{totalPlayers}</div>
          <div className="stat-card-label">Jogadores</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{totalGoals}</div>
          <div className="stat-card-label">Gols</div>
        </div>
      </div>

      {/* Highlights Panel */}
      {players && players.length > 0 && (highlights.artilheiro || highlights.garcom || highlights.muralha || highlights.pernaDePau) && (
        <>
          <div className="section-title">🏆 Destaques & Conquistas</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
            
            {highlights.muralha && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '12px' }}>
                <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🛡️</span>
                <div style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.5px' }}>Dono do Racha</div>
                <div style={{ fontWeight: '700', fontSize: '0.85rem', margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{highlights.muralha.player.nickname || highlights.muralha.player.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Aproveitamento: {highlights.muralha.winRate}%</div>
              </div>
            )}

            {highlights.artilheiro && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '12px' }}>
                <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>👟</span>
                <div style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--green-primary)', letterSpacing: '0.5px' }}>Artilheiro</div>
                <div style={{ fontWeight: '700', fontSize: '0.85rem', margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{highlights.artilheiro.player.nickname || highlights.artilheiro.player.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Gols: {highlights.artilheiro.goals}</div>
              </div>
            )}

            {highlights.garcom && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '12px' }}>
                <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🤝</span>
                <div style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--blue)', letterSpacing: '0.5px' }}>Garçom</div>
                <div style={{ fontWeight: '700', fontSize: '0.85rem', margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{highlights.garcom.player.nickname || highlights.garcom.player.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Assis: {highlights.garcom.assists}</div>
              </div>
            )}

            {highlights.pernaDePau && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '12px' }}>
                <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🪵</span>
                <div style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--red)', letterSpacing: '0.5px' }}>Perna de Pau</div>
                <div style={{ fontWeight: '700', fontSize: '0.85rem', margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{highlights.pernaDePau.player.nickname || highlights.pernaDePau.player.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Derrotas: {highlights.pernaDePau.losses}</div>
              </div>
            )}

          </div>
        </>
      )}
      {craque && (
        <>
          <div className="section-title">Craque da Rodada</div>
          <div className="craque-card" onClick={() => navigate(`/players/${craque.player.id}`)} style={{ cursor: 'pointer', marginBottom: '24px' }}>
            <div className="craque-label">⭐ Destaque</div>
            {craque.player.photo ? (
              <img src={craque.player.photo} alt={craque.player.name} className="profile-photo" style={{ width: '80px', height: '80px', margin: '0 auto 8px' }} />
            ) : (
              <div className="profile-avatar" style={{ width: '80px', height: '80px', fontSize: '1.5rem', margin: '0 auto 8px' }}>
                {getInitials(craque.player.name)}
              </div>
            )}
            <div className="craque-name">{craque.player.nickname || craque.player.name}</div>
            <div className="craque-stat">
              ⚽ {craque.goals} gol{craque.goals > 1 ? 's' : ''} na última partida
            </div>
          </div>
        </>
      )}

      {/* Últimas Partidas */}
      <div className="section-title">Últimas Partidas</div>
      {matches && matches.length > 0 ? (
        <div className="matches-list">
          {matches.map(m => (
            <MatchCard key={m.id} match={m} onClick={() => navigate(`/matches/${m.id}`)} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">⚽</div>
          <div className="empty-state-text">Nenhuma partida registrada ainda.<br />Cadastre sua primeira pelada!</div>
          {user ? (
            <button className="btn btn-primary" onClick={() => navigate('/matches/new')}>
              + Nova Partida
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Fazer Login
            </button>
          )}
        </div>
      )}

      {/* FAB */}
      {user && (
        <button className="fab" onClick={() => navigate('/matches/new')} aria-label="Nova partida">
          +
        </button>
      )}
    </div>
  );
}
