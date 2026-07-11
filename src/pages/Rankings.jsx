import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getRankings } from '../utils/stats';
import { getInitials } from '../utils/formatters';

const CATEGORIES = [
  { key: 'goals', label: '⚽ Artilheiros', valueLabel: 'Gols' },
  { key: 'assists', label: '🅰️ Assistências', valueLabel: 'Assists' },
  { key: 'winRate', label: '📈 Aproveitamento', valueLabel: '%' },
  { key: 'games', label: '🏟️ Mais Jogos', valueLabel: 'Jogos' },
];

const PERIODS = [
  { key: null, label: 'Todo o tempo' },
  { key: '3months', label: 'Últimos 3 meses' },
  { key: 'year', label: 'Este ano' },
];

export default function Rankings() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('goals');
  const [period, setPeriod] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRankings(category, period).then(r => {
      setRankings(r);
      setLoading(false);
    });
  }, [category, period]);

  const currentCat = CATEGORIES.find(c => c.key === category);

  const getRankMedal = (idx) => {
    if (idx === 0) return { class: 'gold', emoji: '🥇' };
    if (idx === 1) return { class: 'silver', emoji: '🥈' };
    if (idx === 2) return { class: 'bronze', emoji: '🥉' };
    return { class: '', emoji: '' };
  };

  const getValue = (stat) => {
    switch (category) {
      case 'goals': return stat.goals;
      case 'assists': return stat.assists;
      case 'winRate': return `${stat.winRate}%`;
      case 'games': return stat.games;
      default: return 0;
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>🏆 Rankings</h1>
      </div>

      {/* Category Tabs */}
      <div className="tabs">
        {CATEGORIES.map(c => (
          <button key={c.key} className={`tab ${category === c.key ? 'active' : ''}`}
            onClick={() => setCategory(c.key)}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Period filter */}
      <div className="chips">
        {PERIODS.map(p => (
          <button key={p.key || 'all'} className={`chip ${period === p.key ? 'active' : ''}`}
            onClick={() => setPeriod(p.key)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Scoreboard */}
      {loading ? (
        <div className="loading"><div className="loading-spinner" /> Carregando...</div>
      ) : rankings.length > 0 ? (
        <div className="scoreboard">
          <div className="scoreboard-header">
            <span style={{ minWidth: '30px' }}>#</span>
            <span style={{ flex: 1 }}>Jogador</span>
            <span style={{ minWidth: '50px', textAlign: 'right' }}>{currentCat?.valueLabel}</span>
          </div>
          {rankings.slice(0, 15).map((stat, idx) => {
            const medal = getRankMedal(idx);
            return (
              <div key={stat.playerId} className="scoreboard-row"
                onClick={() => navigate(`/players/${stat.playerId}`)} style={{ cursor: 'pointer' }}>
                <div className={`scoreboard-rank ${medal.class}`}>
                  {medal.emoji || idx + 1}
                </div>
                <div className="scoreboard-player">
                  {stat.player?.photo ? (
                    <img src={stat.player.photo} alt="" className="scoreboard-player-photo" />
                  ) : (
                    <span className="scoreboard-player-avatar">{getInitials(stat.player?.name)}</span>
                  )}
                  <span style={{ fontSize: '0.85rem' }}>{stat.player?.nickname || stat.player?.name}</span>
                </div>
                <div className="scoreboard-value">{getValue(stat)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🏆</div>
          <div className="empty-state-text">Sem dados suficientes para ranking.</div>
        </div>
      )}
    </div>
  );
}
