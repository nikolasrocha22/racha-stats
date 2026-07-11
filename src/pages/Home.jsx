import React from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getCraqueDaRodada } from '../utils/stats';
import MatchCard from '../components/MatchCard';
import { getInitials } from '../utils/formatters';

export default function Home() {
  const navigate = useNavigate();
  const matches = useLiveQuery(() => db.matches.orderBy('date').reverse().limit(5).toArray());
  const players = useLiveQuery(() => db.players.toArray());
  const allGoals = useLiveQuery(() => db.goals.toArray());
  const [craque, setCraque] = React.useState(null);

  React.useEffect(() => {
    getCraqueDaRodada().then(setCraque);
  }, [matches]);

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

      {/* Craque da Rodada */}
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
          <button className="btn btn-primary" onClick={() => navigate('/matches/new')}>
            + Nova Partida
          </button>
        </div>
      )}

      {/* FAB */}
      <button className="fab" onClick={() => navigate('/matches/new')} aria-label="Nova partida">
        +
      </button>
    </div>
  );
}
