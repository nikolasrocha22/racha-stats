import React from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router';
import { Pencil, Trash2, Award, ArrowLeft, Calendar, CircleDot } from 'lucide-react';
import { db, useLiveQuery, deletePlayer } from '../db';
import { getPlayerStats, getAllPlayerStats } from '../utils/stats';
import { getPlayerBadges } from '../utils/badges';
import StatBar from '../components/StatBar';
import PlayerCard from '../components/PlayerCard';
import MatchCard from '../components/MatchCard';
import { getInitials, getResultLabel, getResultClass } from '../utils/formatters';
import { generatePlayerTitles } from '../ai';
import { useToast } from '../components/ToastContext';

// SVG Radar Chart for FUT attributes
function RadarChart({ stats, size = 200 }) {
  const attrs = [
    { key: 'pac', label: 'PAC' },
    { key: 'sho', label: 'SHO' },
    { key: 'pas', label: 'PAS' },
    { key: 'dri', label: 'DRI' },
    { key: 'def', label: 'DEF' },
    { key: 'phy', label: 'PHY' }
  ];

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const angleStep = (Math.PI * 2) / attrs.length;

  const getPoint = (i, value) => {
    const angle = angleStep * i - Math.PI / 2;
    const r = (value / 99) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      {/* Grid */}
      {gridLevels.map(level => {
        const points = attrs.map((_, i) => {
          const p = getPoint(i, 99 * level);
          return `${p.x},${p.y}`;
        }).join(' ');
        return <polygon key={level} points={points} fill="none" stroke="rgba(46,204,64,0.15)" strokeWidth="1" />;
      })}

      {/* Axis lines */}
      {attrs.map((_, i) => {
        const p = getPoint(i, 99);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(46,204,64,0.1)" strokeWidth="1" />;
      })}

      {/* Data polygon */}
      <polygon
        points={attrs.map((a, i) => {
          const p = getPoint(i, stats[a.key] || 40);
          return `${p.x},${p.y}`;
        }).join(' ')}
        fill="rgba(46,204,64,0.2)"
        stroke="var(--green-primary)"
        strokeWidth="2"
      />

      {/* Data points and labels */}
      {attrs.map((a, i) => {
        const p = getPoint(i, stats[a.key] || 40);
        const labelP = getPoint(i, 99 + 16);
        return (
          <g key={a.key}>
            <circle cx={p.x} cy={p.y} r="3" fill="var(--green-primary)" />
            <text
              x={labelP.x} y={labelP.y}
              textAnchor="middle" dominantBaseline="middle"
              fill="var(--text-secondary)"
              fontSize="10"
              fontWeight="700"
              fontFamily="var(--font-display)"
            >
              {a.label}
            </text>
            <text
              x={labelP.x} y={labelP.y + 12}
              textAnchor="middle" dominantBaseline="middle"
              fill="var(--green-primary)"
              fontSize="11"
              fontWeight="800"
              fontFamily="var(--font-mono)"
            >
              {stats[a.key] || 40}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function PlayerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isAdmin } = useOutletContext();
  const playerId = Number(id);
  const player = useLiveQuery(() => db.players.get(playerId), [id]);
  const [stats, setStats] = React.useState(null);
  const [allStats, setAllStats] = React.useState([]);
  const [playerMatches, setPlayerMatches] = React.useState([]);
  const [title, setTitle] = React.useState('');
  const [loadingTitle, setLoadingTitle] = React.useState(false);
  const [badges, setBadges] = React.useState([]);

  React.useEffect(() => {
    if (!player) return;

    // Load stats
    getPlayerStats(playerId).then(s => {
      setStats(s);

      // Load badges (needs allStats)
      getAllPlayerStats().then(all => {
        setAllStats(all);
        getPlayerBadges(s, all).then(setBadges);
      });
    });

    // Auto-generate title via AI
    if (!title && !loadingTitle) {
      setLoadingTitle(true);
      getPlayerStats(playerId).then(s => {
        generatePlayerTitles([{ id: playerId, name: player.nickname || player.name, ...s }])
          .then(titles => {
            const t = titles[playerId] || titles[String(playerId)] || '';
            setTitle(t);
          })
          .catch(() => {})
          .finally(() => setLoadingTitle(false));
      });
    }

    // Get matches this player participated in
    (async () => {
      const allLineups = await db.lineups.toArray();
      const lineups = allLineups.filter(l => l.playerId === playerId);
      const matchIds = [...new Set(lineups.map(l => l.matchId))];
      const allMatches = await db.matches.toArray();
      const matches = allMatches.filter(m => matchIds.includes(m.id));
      const enriched = matches.map(m => {
        const lineup = lineups.find(l => l.matchId === m.id);
        return { ...m, playerTeam: lineup?.team };
      }).sort((a, b) => b.date?.localeCompare(a.date));
      setPlayerMatches(enriched);
    })();
  }, [player, playerId]);

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${player.name}? Isso removerá o jogador de todas as escalações.`)) return;
    try {
      await deletePlayer(playerId);
      toast.success('Jogador excluído com sucesso!');
      navigate('/players');
    } catch (err) {
      toast.error('Erro ao excluir jogador: ' + err.message);
    }
  };

  if (!player) return <div className="page"><div className="loading"><div className="loading-spinner" /> Carregando...</div></div>;

  const canEdit = isAdmin || (user && player.user_id === user.id);
  const canDelete = isAdmin;

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/players')}>
          <ArrowLeft size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          <span>Voltar</span>
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          {canEdit && (
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/players/${id}/edit`)}>
              <Pencil size={14} />
            </button>
          )}
          {canDelete && (
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* FUT Card + Radar */}
      <div className="profile-fut-section">
        <div className="profile-fut-card-wrapper">
          <PlayerCard player={player} stats={stats} title={title || (loadingTitle ? '...' : '')} />
        </div>

        {stats && (
          <div className="profile-radar-wrapper">
            <RadarChart stats={stats} size={220} />
          </div>
        )}
      </div>

      {/* Title */}
      {title && (
        <div className="profile-title-banner">
          <span>"{title}"</span>
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <>
          <div className="section-title">
            <Award size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            <span>Conquistas</span>
          </div>
          <div className="badges-grid">
            {badges.map(b => (
              <div key={b.id} className="badge-card" title={b.description}>
                <span className="badge-emoji">{b.emoji}</span>
                <span className="badge-name">{b.name}</span>
              </div>
            ))}
          </div>
        </>
      )}

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
