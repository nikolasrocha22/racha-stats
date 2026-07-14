import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export default function MatchCard({ match, onClick }) {
  const winner = match.scoreA > match.scoreB ? 'A' : match.scoreB > match.scoreA ? 'B' : null;

  return (
    <div className="tv-scoreboard" onClick={onClick} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
      {/* Meta Row (Date & Location) */}
      <div className="tv-meta-row">
        <div className="tv-meta-item">
          <Calendar size={13} />
          <span>{formatDate(match.date)}</span>
        </div>
        {match.location && (
          <div className="tv-meta-item">
            <MapPin size={13} />
            <span>{match.location}</span>
          </div>
        )}
      </div>

      {/* Match Score Layout */}
      <div className="tv-match-layout">
        {/* Team A */}
        <div className="tv-team team-a">
          <div className="tv-team-name-row">
            <span className="tv-color-dot" style={{ background: match.teamAColor }} />
            <span className="tv-team-name">{match.teamAName}</span>
          </div>
          {winner === 'A' && <span className="tv-winner-bar" />}
        </div>

        {/* Score A */}
        <div className="tv-score">
          {match.scoreA}
        </div>

        {/* Thin TV Divider */}
        <div className="tv-divider" />

        {/* Score B */}
        <div className="tv-score">
          {match.scoreB}
        </div>

        {/* Team B */}
        <div className="tv-team team-b">
          <div className="tv-team-name-row">
            <span className="tv-team-name">{match.teamBName}</span>
            <span className="tv-color-dot" style={{ background: match.teamBColor }} />
          </div>
          {winner === 'B' && <span className="tv-winner-bar" />}
        </div>
      </div>
    </div>
  );
}
