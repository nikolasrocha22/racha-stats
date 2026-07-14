import React from 'react';
import { formatDate } from '../utils/formatters';

export default function MatchCard({ match, onClick }) {
  const winner = match.scoreA > match.scoreB ? 'A' : match.scoreB > match.scoreA ? 'B' : null;
  const handleKeyDown = event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick?.(); }
  };

  return (
    <article className="match-card" onClick={onClick} onKeyDown={handleKeyDown} role="button" tabIndex={0}>
      <header className="match-card-date"><span>{formatDate(match.date)}</span>{match.location && <span className="match-location">{match.location}</span>}</header>
      <div className="match-card-score">
        <div className={`match-card-team ${winner === 'A' ? 'winner' : ''}`}>
          <div className="match-card-team-name"><span className="match-card-team-dot" style={{ background: match.teamAColor }} />{match.teamAName}</div>
          <div className="match-card-team-score">{match.scoreA}</div>
        </div>
        <div className="match-card-vs"><span>Final</span><strong>—</strong></div>
        <div className={`match-card-team ${winner === 'B' ? 'winner' : ''}`}>
          <div className="match-card-team-name">{match.teamBName}<span className="match-card-team-dot" style={{ background: match.teamBColor }} /></div>
          <div className="match-card-team-score">{match.scoreB}</div>
        </div>
      </div>
    </article>
  );
}
