import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { Users, Search, Plus } from 'lucide-react';
import { db, useLiveQuery } from '../db';
import { getAllPlayerStats } from '../utils/stats';
import PlayerCard from '../components/PlayerCard';
import { SkeletonPlayerCard } from '../components/Skeleton';
import { POSITIONS } from '../utils/formatters';

export default function Players() {
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const players = useLiveQuery(() => db.players.toArray());
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');

  React.useEffect(() => {
    getAllPlayerStats().then(allStats => {
      const map = {};
      allStats.forEach(s => { map[s.playerId] = s; });
      setStats(map);
    });
  }, [players]);

  const getPlayerOvr = (p) => {
    const s = stats[p.id];
    const pac = s?.pac ?? p.initialPac ?? 60;
    const sho = s?.sho ?? p.initialSho ?? 60;
    const pas = s?.pas ?? p.initialPas ?? 60;
    const dri = s?.dri ?? p.initialDri ?? 60;
    const def = s?.def ?? p.initialDef ?? 60;
    const phy = s?.phy ?? p.initialPhy ?? 60;
    return s?.currentOvr ?? Math.round((pac + sho + pas + dri + def + phy) / 6);
  };

  const filtered = (players || [])
    .filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.nickname && p.nickname.toLowerCase().includes(search.toLowerCase()));
      const matchPos = !positionFilter || p.position === positionFilter;
      return matchSearch && matchPos;
    })
    .sort((a, b) => {
      if (sortBy === 'ovr') {
        return getPlayerOvr(b) - getPlayerOvr(a);
      }
      if (sortBy === 'goals') {
        const ga = stats[a.id]?.goals || 0;
        const gb = stats[b.id]?.goals || 0;
        return gb - ga;
      }
      if (sortBy === 'wins') {
        const wa = stats[a.id]?.wins || 0;
        const wb = stats[b.id]?.wins || 0;
        return wb - wa;
      }
      return a.name.localeCompare(b.name);
    });

  const isLoading = players === null;

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={22} />
          <span>Jogadores</span>
        </h1>
        {user && (
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/players/new')}>
            <Plus size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            <span>Novo</span>
          </button>
        )}
      </div>

      {players && players.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar jogador..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Filters Row */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              className="form-select"
              value={positionFilter}
              onChange={e => setPositionFilter(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">Todas Posições</option>
              {POSITIONS.filter(p => p.value).map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            <select
              className="form-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="name">Ordenar por Nome</option>
              <option value="ovr">Ordenar por Geral (OVR)</option>
              <option value="goals">Ordenar por Gols</option>
              <option value="wins">Ordenar por Vitórias</option>
            </select>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="players-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonPlayerCard key={i} />)}
        </div>
      ) : filtered.length > 0 ? (
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
          <div className="empty-state-icon"><Users size={48} style={{ opacity: 0.5 }} /></div>
          <div className="empty-state-text">Nenhum jogador cadastrado.<br />Adicione os craques da pelada!</div>
          {user ? (
            <button className="btn btn-primary" onClick={() => navigate('/players/new')}>
              + Cadastrar Jogador
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Fazer Login
            </button>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><Search size={48} style={{ opacity: 0.5 }} /></div>
          <div className="empty-state-text">Nenhum jogador encontrado.</div>
        </div>
      )}
    </div>
  );
}
