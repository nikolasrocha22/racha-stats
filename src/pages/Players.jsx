import React from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getAllPlayerStats } from '../utils/stats';
import PlayerCard from '../components/PlayerCard';

export default function Players() {
  const navigate = useNavigate();
  const players = useLiveQuery(() => db.players.toArray());
  const [stats, setStats] = React.useState({});
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    getAllPlayerStats().then(allStats => {
      const map = {};
      allStats.forEach(s => { map[s.playerId] = s; });
      setStats(map);
    });
  }, [players]);

  const filtered = (players || []).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.nickname && p.nickname.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>👥 Jogadores</h1>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/players/new')}>
          + Novo
        </button>
      </div>

      {players && players.length > 0 && (
        <div className="form-group">
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Buscar jogador..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="players-grid">
          {filtered.map(p => (
            <PlayerCard
              key={p.id}
              player={p}
              stats={stats[p.id]}
              onClick={() => navigate(`/players/${p.id}`)}
            />
          ))}
        </div>
      ) : players && players.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <div className="empty-state-text">Nenhum jogador cadastrado.<br />Adicione os craques da pelada!</div>
          <button className="btn btn-primary" onClick={() => navigate('/players/new')}>
            + Cadastrar Jogador
          </button>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text">Nenhum jogador encontrado.</div>
        </div>
      )}
    </div>
  );
}
