import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import MatchCard from '../components/MatchCard';

export default function Matches() {
  const navigate = useNavigate();
  const matches = useLiveQuery(() => db.matches.orderBy('date').reverse().toArray());
  const players = useLiveQuery(() => db.players.toArray());
  const lineups = useLiveQuery(() => db.lineups.toArray());

  const [filterPlayer, setFilterPlayer] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const filtered = React.useMemo(() => {
    if (!matches) return [];
    let result = [...matches];

    if (filterDateFrom) result = result.filter(m => m.date >= filterDateFrom);
    if (filterDateTo) result = result.filter(m => m.date <= filterDateTo);

    if (filterTeam) {
      result = result.filter(m =>
        m.teamAName.toLowerCase().includes(filterTeam.toLowerCase()) ||
        m.teamBName.toLowerCase().includes(filterTeam.toLowerCase())
      );
    }

    if (filterPlayer && lineups) {
      const pid = Number(filterPlayer);
      const matchIds = new Set(lineups.filter(l => l.playerId === pid).map(l => l.matchId));
      result = result.filter(m => matchIds.has(m.id));
    }

    return result;
  }, [matches, lineups, filterPlayer, filterTeam, filterDateFrom, filterDateTo]);

  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="page">
      <div className="page-header">
        <h1>⚽ Partidas</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(!showFilters)}>
            🔍 Filtros
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/matches/new')}>
            + Nova
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card" style={{ marginBottom: '16px', padding: '12px' }}>
          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label className="form-label">Jogador</label>
            <select className="form-select" value={filterPlayer} onChange={e => setFilterPlayer(e.target.value)}>
              <option value="">Todos</option>
              {(players || []).map(p => (
                <option key={p.id} value={p.id}>{p.nickname || p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label className="form-label">Time</label>
            <input className="form-input" value={filterTeam} onChange={e => setFilterTeam(e.target.value)} placeholder="Nome do time..." />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">De</label>
              <input type="date" className="form-input" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">Até</label>
              <input type="date" className="form-input" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
            </div>
          </div>
          {(filterPlayer || filterTeam || filterDateFrom || filterDateTo) && (
            <button className="btn btn-secondary btn-sm btn-block" style={{ marginTop: '8px' }}
              onClick={() => { setFilterPlayer(''); setFilterTeam(''); setFilterDateFrom(''); setFilterDateTo(''); }}>
              Limpar Filtros
            </button>
          )}
        </div>
      )}

      <div className="text-sm text-muted mb-md">
        {filtered.length} partida{filtered.length !== 1 ? 's' : ''}
      </div>

      {filtered.length > 0 ? (
        <div className="matches-list">
          {filtered.map(m => (
            <MatchCard key={m.id} match={m} onClick={() => navigate(`/matches/${m.id}`)} />
          ))}
        </div>
      ) : matches && matches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚽</div>
          <div className="empty-state-text">Nenhuma partida registrada.<br />Hora de bater uma bola!</div>
          <button className="btn btn-primary" onClick={() => navigate('/matches/new')}>
            + Nova Partida
          </button>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text">Nenhuma partida encontrada com esses filtros.</div>
        </div>
      )}
    </div>
  );
}
