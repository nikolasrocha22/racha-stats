import React from 'react';
import { getInitials } from '../utils/formatters';

export default function PlayerCard({ player, stats, title, onClick }) {
  // Determine card tier:
  // If player has played less than 3 matches, they are visualised as a "rookie" (new custom neutral tier)
  // Otherwise, use wins-based FUT tiers (bronze, silver, gold)
  let tier = 'bronze';
  const games = stats?.games || 0;
  
  if (games < 3) {
    tier = 'rookie';
  } else {
    const wins = stats?.wins || 0;
    if (wins >= 6) tier = 'gold';
    else if (wins >= 3) tier = 'silver';
  }

  // Map position to 3-letter FIFA code
  const posMap = {
    GOL: 'GK',
    ZAG: 'CB',
    LAT: 'SB',
    VOL: 'CDM',
    MEI: 'CAM',
    ATA: 'ST',
    PE: 'LW',
    PD: 'RW',
    'Goleiro': 'GK',
    'Zagueiro': 'CB',
    'Lateral': 'SB',
    'Meio-Campo': 'MID',
    'Atacante': 'ST'
  };
  const posCode = posMap[player.position] || 'SUB';

  // Get evolved stats or fall back to player's manually set initial values
  const pac = stats?.pac ?? player.initialPac ?? 60;
  const sho = stats?.sho ?? player.initialSho ?? 60;
  const pas = stats?.pas ?? player.initialPas ?? 60;
  const dri = stats?.dri ?? player.initialDri ?? 60;
  const def = stats?.def ?? player.initialDef ?? 60;
  const phy = stats?.phy ?? player.initialPhy ?? 60;

  // OVR is the average of current attributes (either calculated from stats or fallback)
  const ovr = stats?.currentOvr ?? Math.round((pac + sho + pas + dri + def + phy) / 6);

  return (
    <div className={`player-card-fut ${tier}`} onClick={onClick} role="button" tabIndex={0}>
      {/* FUT Top section with OVR and Position */}
      <div className="fut-card-header" style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <div className="fut-ovr-pos" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span className="fut-ovr" style={{ fontSize: '1.4rem', fontWeight: '900', fontFamily: 'var(--font-display)', lineHeight: '1' }}>
            {ovr}
          </span>
          <span className="fut-pos-code" style={{ fontSize: '0.65rem', fontWeight: '800', opacity: 0.8, letterSpacing: '0.5px' }}>
            {posCode}
          </span>
        </div>
        {title && (
          <div className="player-card-title fut-title" style={{ fontSize: '0.6rem', padding: '2px 6px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </div>
        )}
      </div>

      {player.photo ? (
        <div className="player-card-photo fut-photo" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid rgba(0,0,0,0.15)', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
          <img src={player.photo} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div className="player-card-avatar fut-avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(0,0,0,0.15)', background: 'rgba(0,0,0,0.1)', color: 'inherit', fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: '800' }}>
          {getInitials(player.name)}
        </div>
      )}

      <div className="player-card-name fut-name" style={{ marginTop: '4px', fontSize: '0.9rem', fontWeight: '700', width: '100%', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {player.nickname || player.name}
      </div>
      
      {player.nickname && (
        <div className="player-card-nickname fut-nickname" style={{ fontSize: '0.65rem', opacity: 0.7, width: '100%', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
