import React from 'react';
import { formatDate } from '../utils/formatters';

export default function MatchCard({ match, onClick }) {
  const winner = match.scoreA > match.scoreB ? 'A' : match.scoreB > match.scoreA ? 'B' : null;

  return (
    <div className="match-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="match-card-date">
        📅 {formatDate(match.date)}
        {match.location && <span> • 📍 {match.location}</span>}
      </div>
      <div className="match-card-score">
        <div className="match-card-team">
          <div className="match-card-team-name">
            <span className="match-card-team-dot" style={{ background: match.teamAColor }} />
            {match.teamAName}
          </div>
          <div className="match-card-team-score" style={{ color: winner === 'A' ? 'var(--green-primary)' : undefined }}>
            {match.scoreA}
          </div>
        </div>
        <div className="match-card-vs">✕</div>
        <div className="match-card-team">
          <div className="match-card-team-name">
            {match.teamBName}
            <span className="match-card-team-dot" style={{ background: match.teamBColor }} />
          </div>
          <div className="match-card-team-score" style={{ color: winner === 'B' ? 'var(--green-primary)' : undefined }}>
            {match.scoreB}
          </div>
        </div>
      </div>
    </div>
  );
}
