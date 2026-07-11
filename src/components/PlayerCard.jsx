import React from 'react';
import { getInitials } from '../utils/formatters';

export default function PlayerCard({ player, stats, title, onClick }) {
  // Determine card tier based on absolute wins
  let tier = 'bronze';
  if (stats) {
    const wins = stats.wins || 0;
    if (wins >= 6) tier = 'gold';
    else if (wins >= 3) tier = 'silver';
  }

  // Map position to 3-letter FIFA code
  const posMap = {
    'Goleiro': 'GK',
    'Zagueiro': 'CB',
    'Lateral': 'SB',
    'Meio-Campo': 'MID',
    'Atacante': 'ST'
  };
  const posCode = posMap[player.position] || 'SUB';

  // Calculate FUT attributes dynamically
  const games = stats?.games || 0;
  const winRate = stats?.winRate || 0;
  const goals = stats?.goals || 0;
  const assists = stats?.assists || 0;

  const pac = Math.round(55 + (winRate * 0.2) + (player.position === 'Atacante' || player.position === 'Meio-Campo' ? 15 : 0));
  const sho = Math.round(40 + Math.min(50, (goals / Math.max(1, games)) * 30) + (player.position === 'Atacante' ? 15 : 0));
  const pas = Math.round(45 + Math.min(45, (assists / Math.max(1, games)) * 40) + (player.position === 'Meio-Campo' ? 15 : 0));
  const dri = Math.round(50 + (winRate * 0.25) + (player.position === 'Atacante' ? 12 : 0));
  
  // DEF (Defense): High for Defenders and Goalkeepers
  const def = Math.round(35 + (player.position === 'Zagueiro' || player.position === 'Goleiro' ? 45 : 10) + (winRate * 0.1));
  
  // PHY (Physical): High for defenders and based on games played
  const phy = Math.round(50 + Math.min(40, games * 4) + (player.position === 'Zagueiro' ? 10 : 0));

  // OVR (Overall rating): Average of the 6 FUT stats
  const ovr = games > 0 
    ? Math.min(99, Math.round((pac + sho + pas + dri + def + phy) / 6))
    : 50;

  return (
    <div className={`player-card-fut ${tier}`} onClick={onClick} role="button" tabIndex={0}>
      {/* FUT Top section with OVR and Position */}
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: '900', fontFamily: 'var(--font-display)', lineHeight: '1' }}>
            {ovr}
          </span>
          <span style={{ fontSize: '0.65rem', fontWeight: '800', opacity: 0.8, letterSpacing: '0.5px' }}>
            {posCode}
          </span>
        </div>
        {title && (
          <div className="player-card-title" style={{ fontSize: '0.6rem', padding: '2px 6px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </div>
        )}
      </div>

      {player.photo ? (
        <div className="player-card-photo" style={{ border: '2px solid rgba(0,0,0,0.15)', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
          <img src={player.photo} alt={player.name} />
        </div>
      ) : (
        <div className="player-card-avatar" style={{ border: '2px solid rgba(0,0,0,0.15)', background: 'rgba(0,0,0,0.1)', color: 'inherit' }}>
          {getInitials(player.name)}
        </div>
      )}

      <div className="player-card-name" style={{ marginTop: '4px', fontSize: '0.9rem', width: '100%', textAlign: 'center' }}>
        {player.nickname || player.name}
      </div>
      
      {player.nickname && (
        <div className="player-card-nickname" style={{ fontSize: '0.65rem', opacity: 0.7, width: '100%', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {player.name}
        </div>
      )}

      {/* FUT Stats Attributes Grid */}
      <div className="fut-stats-grid">
        <div className="fut-stat">
          <span className="fut-stat-value">{pac}</span>
          <span className="fut-stat-label">PAC</span>
        </div>
        <div className="fut-stat">
          <span className="fut-stat-value">{sho}</span>
          <span className="fut-stat-label">SHO</span>
        </div>
        <div className="fut-stat">
          <span className="fut-stat-value">{pas}</span>
          <span className="fut-stat-label">PAS</span>
        </div>
        <div className="fut-stat">
          <span className="fut-stat-value">{dri}</span>
          <span className="fut-stat-label">DRI</span>
        </div>
        <div className="fut-stat">
          <span className="fut-stat-value">{def}</span>
          <span className="fut-stat-label">DEF</span>
        </div>
        <div className="fut-stat">
          <span className="fut-stat-value">{phy}</span>
          <span className="fut-stat-label">PHY</span>
        </div>
      </div>
    </div>
  );
}
