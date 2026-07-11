import React from 'react';
import { getInitials } from '../utils/formatters';

export default function PlayerCard({ player, stats, title, onClick }) {
  return (
    <div className="player-card" onClick={onClick} role="button" tabIndex={0}>
      {player.photo ? (
        <div className="player-card-photo">
          <img src={player.photo} alt={player.name} />
        </div>
      ) : (
        <div className="player-card-avatar">
          {getInitials(player.name)}
        </div>
      )}
      <div className="player-card-name">{player.nickname || player.name}</div>
      {player.nickname && <div className="player-card-nickname">{player.name}</div>}
      {player.position && <div className="player-card-position">{player.position}</div>}
      {stats && (
        <div className="player-card-stats">
          <div className="player-card-stat">
            <div className="player-card-stat-value">{stats.games}</div>
            <div className="player-card-stat-label">Jogos</div>
          </div>
          <div className="player-card-stat">
            <div className="player-card-stat-value">{stats.goals}</div>
            <div className="player-card-stat-label">Gols</div>
          </div>
          <div className="player-card-stat">
            <div className="player-card-stat-value">{stats.winRate}%</div>
            <div className="player-card-stat-label">Vitórias</div>
          </div>
        </div>
      )}
      {title && <div className="player-card-title">"{title}"</div>}
    </div>
  );
}
