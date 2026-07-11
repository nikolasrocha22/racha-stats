import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, deletePlayer } from '../db';
import { getPlayerStats } from '../utils/stats';
import StatBar from '../components/StatBar';
import MatchCard from '../components/MatchCard';
import { getInitials, formatDate, getResultLabel, getResultClass } from '../utils/formatters';
import { isAIConfigured, generatePlayerTitles } from '../ai';

export default function PlayerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const playerId = Number(id);
  const player = useLiveQuery(() => db.players.get(playerId), [id]);
  const [stats, setStats] = React.useState(null);
  const [playerMatches, setPlayerMatches] = React.useState([]);
  const [title, setTitle] = React.useState('');
  const [loadingTitle, setLoadingTitle] = React.useState(false);

  React.useEffect(() => {
    if (!player) return;
    getPlayerStats(playerId).then(setStats);

    // Get matches this player participated in
    (async () => {
      const lineups = await db.lineups.where('playerId').equals(playerId).toArray();
      const matchIds = [...new Set(lineups.map(l => l.matchId))];
      const matches = await db.matches.where('id').anyOf(matchIds).toArray();
      const enriched = matches.map(m => {
        const lineup = lineups.find(l => l.matchId === m.id);
        return { ...m, playerTeam: lineup?.team };
      }).sort((a, b) => b.date?.localeCompare(a.date));
      setPlayerMatches(enriched);
    })();
  }, [player, playerId]);

  const handleGenerateTitle = async () => {
    if (!stats) return;
    setLoadingTitle(true);
    try {
      const titles = await generatePlayerTitles([{ id: playerId, name: player.nickname || player.name, ...stats }]);
      setTitle(titles[playerId] || titles[String(playerId)] || 'Craque da Pelada');
    } catch (err) {
      setTitle('Erro ao gerar título');
    }
    setLoadingTitle(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${player.name}? Isso removerá o jogador de todas as escalações.`)) return;
    await deletePlayer(playerId);
    navigate('/players');
  };

  if (!player) return <div className="page"><div className="loading"><div className="loading-spinner" /> Carregando...</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/players')}>← Voltar</button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/players/${id}/edit`)}>✏️</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑️</button>
        </div>
      </div>

      {/* Profile header */}
      <div className="profile-header">
        {player.photo ? (
          <img src={player.photo} alt={player.name} className="profile-photo" />
        ) : (
          <div className="profile-avatar">{getInitials(player.name)}</div>
        )}
        <div className="profile-name">{player.nickname || player.name}</div>
        {player.nickname && <div className="profile-nickname">{player.name}</div>}
        {player.position && <div className="player-card-position" style={{ marginTop: '8px' }}>{player.position}</div>}
        {title && <div className="profile-title">"{title}"</div>}
        {!title && isAIConfigured() && (
          <button className="btn btn-secondary btn-sm" onClick={handleGenerateTitle} disabled={loadingTitle} style={{ marginTop: '8px' }}>
            {loadingTitle ? '✨ Gerando...' : '✨ Gerar Título IA'}
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <>
          <div className="section-title">Estatísticas</div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-value">{stats.games}</div>
              <div className="stat-card-label">Jogos</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.goals}</div>
              <div className="stat-card-label">Gols</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.assists}</div>
              <div className="stat-card-label">Assists</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-green">{stats.wins}</div>
              <div className="stat-card-label">Vitórias</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value" style={{ color: '#888' }}>{stats.draws}</div>
              <div className="stat-card-label">Empates</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-red">{stats.losses}</div>
              <div className="stat-card-label">Derrotas</div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <StatBar label="Aproveitamento" value={stats.winRate} max={100} suffix="%" />
            <StatBar label="Gols por jogo" value={stats.games > 0 ? (stats.goals / stats.games).toFixed(1) : 0} max={3} />
          </div>
        </>
      )}

      {/* Match history */}
      {playerMatches.length > 0 && (
        <>
          <div className="section-title">Histórico de Partidas</div>
          <div className="matches-list">
            {playerMatches.map(m => (
              <div key={m.id} style={{ position: 'relative' }}>
                <div className={`result-badge ${getResultClass(m.scoreA, m.scoreB, m.playerTeam)}`} style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
                  {getResultLabel(m.scoreA, m.scoreB, m.playerTeam)}
                </div>
                <MatchCard match={m} onClick={() => navigate(`/matches/${m.id}`)} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
