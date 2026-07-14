import React from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { Trophy, Dices, CircleDot, MessageSquare, Plus, Star, Shield, Footprints, Handshake, ThumbsDown, Calendar, ArrowRight } from 'lucide-react';
import { db, useLiveQuery, getPresenceList, getSystemConfig } from '../db';
import { getCraqueDaRodada, getAllPlayerStats } from '../utils/stats';
import MatchCard from '../components/MatchCard';
import { SkeletonMatchCard, SkeletonStats } from '../components/Skeleton';
import { getInitials } from '../utils/formatters';

// Hand-drawn custom SVG soccer ball for the header
function SoccerBallLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="256" cy="256" r="236" fill="#e8f5e9" stroke="#0d1612" strokeWidth="20"/>
      <polygon points="256,190 310,230 290,295 222,295 202,230" fill="#0d1612"/>
      
      <line x1="256" y1="190" x2="256" y2="80" stroke="#0d1612" strokeWidth="15" strokeLinecap="round"/>
      <line x1="310" y1="230" x2="415" y2="195" stroke="#0d1612" strokeWidth="15" strokeLinecap="round"/>
      <line x1="290" y1="295" x2="355" y2="395" stroke="#0d1612" strokeWidth="15" strokeLinecap="round"/>
      <line x1="222" y1="295" x2="157" y2="395" stroke="#0d1612" strokeWidth="15" strokeLinecap="round"/>
      <line x1="202" y1="230" x2="97" y2="195" stroke="#0d1612" strokeWidth="15" strokeLinecap="round"/>

      <polygon points="256,80 200,30 312,30" fill="#0d1612"/>
      <polygon points="415,195 465,140 465,250" fill="#0d1612"/>
      <polygon points="355,395 420,440 310,480" fill="#0d1612"/>
      <polygon points="157,395 92,440 202,480" fill="#0d1612"/>
      <polygon points="97,195 47,140 47,250" fill="#0d1612"/>
    </svg>
  );
}

function getNextSaturday1830() {
  const now = new Date();
  const resultDate = new Date();
  resultDate.setDate(now.getDate() + (6 - now.getDay() + 7) % 7);
  resultDate.setHours(18, 30, 0, 0);
  if (resultDate < now) {
    resultDate.setDate(resultDate.getDate() + 7);
  }
  return resultDate;
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useOutletContext();

  const recentMatches = useLiveQuery(() => db.matches.orderBy('date').reverse().limit(5).toArray());
  const allMatches = useLiveQuery(() => db.matches.toArray());
  const players = useLiveQuery(() => db.players.toArray());
  const allGoals = useLiveQuery(() => db.goals.toArray());
  const [craque, setCraque] = React.useState(null);

  const [highlights, setHighlights] = React.useState({
    artilheiro: null,
    garcom: null,
    muralha: null,
    pernaDePau: null
  });

  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0 });
  const [confirmedCount, setConfirmedCount] = React.useState(0);
  const [matchDate, setMatchDate] = React.useState(getNextSaturday1830());

  React.useEffect(() => {
    getCraqueDaRodada().then(setCraque);
  }, [recentMatches]);

  React.useEffect(() => {
    getAllPlayerStats().then(allStats => {
      if (!allStats || allStats.length === 0) return;

      const artilheiro = [...allStats]
        .filter(s => s.goals > 0)
        .sort((a, b) => b.goals - a.goals)[0] || null;

      const garcom = [...allStats]
        .filter(s => s.assists > 0)
        .sort((a, b) => b.assists - a.assists)[0] || null;

      const muralha = [...allStats]
        .filter(s => s.games >= 3 && s.winRate > 0)
        .sort((a, b) => b.winRate - a.winRate)[0] || null;

      const pernaDePau = [...allStats]
        .filter(s => s.losses > 0)
        .sort((a, b) => b.losses - a.losses)[0] || null;

      setHighlights({ artilheiro, garcom, muralha, pernaDePau });
    });
  }, [players]);

  // Countdown timer & confirmed count
  React.useEffect(() => {
    getPresenceList().then(list => {
      setConfirmedCount(list ? list.length : 0);
    });

    getSystemConfig('next_match_datetime').then(val => {
      const target = val ? new Date(val) : getNextSaturday1830();
      setMatchDate(target);

      const updateTimer = () => {
        const difference = target.getTime() - new Date().getTime();
        if (difference <= 0) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0 });
          return;
        }
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft({ days, hours, minutes });
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000); // update every minute is enough for minutes display
      return () => clearInterval(interval);
    });
  }, []);

  const totalMatches = allMatches?.length || 0;
  const totalPlayers = players?.length || 0;
  const totalGoals = allGoals?.length || 0;
  const isLoading = recentMatches === null;

  const formattedMatchDate = matchDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="page pitch-gradient">
      {/* Hero Header with SVG soccer ball */}
      <div className="hero-section">
        <h1 className="hero-title">
          <SoccerBallLogo size={36} />
          <span>Racha Stats</span>
        </h1>
        <p className="text-muted text-sm" style={{ marginTop: '6px' }}>O histórico oficial das peladas</p>
      </div>

      {/* Stitch-style Countdown Hero Banner */}
      <div className="countdown-hero">
        <div className="countdown-hero-badge">Próximo Racha</div>
        <div className="countdown-hero-title">Arena Racha Stats</div>
        <div className="countdown-hero-meta">
          {formattedMatchDate.charAt(0).toUpperCase() + formattedMatchDate.slice(1)} • {confirmedCount} Jogador{confirmedCount !== 1 ? 'es' : ''} Confirmado{confirmedCount !== 1 ? 's' : ''}
        </div>
        
        <div className="countdown-timer-row">
          <div className="countdown-timer-unit">
            <div className="countdown-timer-number">{String(timeLeft.days).padStart(2, '0')}</div>
            <div className="countdown-timer-label">DIAS</div>
          </div>
          <div className="countdown-timer-divider">:</div>
          <div className="countdown-timer-unit">
            <div className="countdown-timer-number">{String(timeLeft.hours).padStart(2, '0')}</div>
            <div className="countdown-timer-label">HORAS</div>
          </div>
          <div className="countdown-timer-divider">:</div>
          <div className="countdown-timer-unit">
            <div className="countdown-timer-number">{String(timeLeft.minutes).padStart(2, '0')}</div>
            <div className="countdown-timer-label">MINS</div>
          </div>
        </div>

        <button className="countdown-hero-btn" onClick={() => navigate('/next-match')}>
          <span>Confirmar Presença</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Quick Actions */}
      {user && (
        <div className="quick-actions" style={{ marginBottom: '24px' }}>
          <button className="quick-action-btn" onClick={() => navigate('/matches/new')}>
            <span className="quick-action-icon"><CircleDot size={20} /></span>
            <span>Nova Partida</span>
          </button>
          <button className="quick-action-btn" onClick={() => navigate('/team-draw')}>
            <span className="quick-action-icon"><Dices size={20} /></span>
            <span>Sorteio</span>
          </button>
          <button className="quick-action-btn" onClick={() => navigate('/rankings')}>
            <span className="quick-action-icon"><Trophy size={20} /></span>
            <span>Rankings</span>
          </button>
          <button className="quick-action-btn" onClick={() => navigate('/stats-chat')}>
            <span className="quick-action-icon"><MessageSquare size={20} /></span>
            <span>Chat IA</span>
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {isLoading ? (
        <SkeletonStats />
      ) : (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-card-value">{totalMatches}</div>
            <div className="stat-card-label">Partidas</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value">{totalPlayers}</div>
            <div className="stat-card-label">Jogadores</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value">{totalGoals}</div>
            <div className="stat-card-label">Gols</div>
          </div>
        </div>
      )}

      {/* Highlights Panel (Stitch Bento-style base borders, no inline styles) */}
      {players && players.length > 0 && (highlights.artilheiro || highlights.garcom || highlights.muralha || highlights.pernaDePau) && (
        <>
          <div className="section-title">
            <Trophy size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            <span>Destaques & Conquistas</span>
          </div>
          <div className="highlights-grid">

            {highlights.muralha && (
              <div className="highlight-card muralha" onClick={() => navigate(`/players/${highlights.muralha.playerId}`)}>
                <span className="highlight-card-icon" style={{ color: 'var(--gold)' }}><Shield size={24} /></span>
                <div className="highlight-card-title">Dono do Racha</div>
                <div className="highlight-card-name">{highlights.muralha.player.nickname || highlights.muralha.player.name}</div>
                <div className="highlight-card-stat">Aproveitamento: {highlights.muralha.winRate}%</div>
              </div>
            )}

            {highlights.artilheiro && (
              <div className="highlight-card artilheiro" onClick={() => navigate(`/players/${highlights.artilheiro.playerId}`)}>
                <span className="highlight-card-icon" style={{ color: 'var(--green-primary)' }}><Footprints size={24} /></span>
                <div className="highlight-card-title">Artilheiro</div>
                <div className="highlight-card-name">{highlights.artilheiro.player.nickname || highlights.artilheiro.player.name}</div>
                <div className="highlight-card-stat">Gols: {highlights.artilheiro.goals}</div>
              </div>
            )}

            {highlights.garcom && (
              <div className="highlight-card garcom" onClick={() => navigate(`/players/${highlights.garcom.playerId}`)}>
                <span className="highlight-card-icon" style={{ color: 'var(--blue)' }}><Handshake size={24} /></span>
                <div className="highlight-card-title">Garçom</div>
                <div className="highlight-card-name">{highlights.garcom.player.nickname || highlights.garcom.player.name}</div>
                <div className="highlight-card-stat">Assists: {highlights.garcom.assists}</div>
              </div>
            )}

            {highlights.pernaDePau && (
              <div className="highlight-card perna-de-pau" onClick={() => navigate(`/players/${highlights.pernaDePau.playerId}`)}>
                <span className="highlight-card-icon" style={{ color: 'var(--red)' }}><ThumbsDown size={24} /></span>
                <div className="highlight-card-title">Perna de Pau</div>
                <div className="highlight-card-name">{highlights.pernaDePau.player.nickname || highlights.pernaDePau.player.name}</div>
                <div className="highlight-card-stat">Derrotas: {highlights.pernaDePau.losses}</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Craque da Rodada (Unico elemento que mantem o brilho glow) */}
      {craque && (
        <>
          <div className="section-title">Craque da Rodada</div>
          <div className="craque-card" onClick={() => navigate(`/players/${craque.player.id}`)} style={{ cursor: 'pointer', marginBottom: '24px', boxShadow: '0 0 20px var(--shadow-green)' }}>
            <div className="craque-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'middle' }}>
                <Star size={12} fill="var(--gold)" color="var(--gold)" />
                Destaque
              </span>
            </div>
            {craque.player.photo ? (
              <img src={craque.player.photo} alt={craque.player.name} className="profile-photo" style={{ width: '80px', height: '80px', margin: '0 auto 8px' }} />
            ) : (
              <div className="profile-avatar" style={{ width: '80px', height: '80px', fontSize: '1.5rem', margin: '0 auto 8px' }}>
                {getInitials(craque.player.name)}
              </div>
            )}
            <div className="craque-name">{craque.player.nickname || craque.player.name}</div>
            <div className="craque-stat" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <CircleDot size={14} />
              <span>{craque.goals} gol{craque.goals > 1 ? 's' : ''} na última partida</span>
            </div>
          </div>
        </>
      )}

      {/* Últimas Partidas */}
      <div className="section-title">Últimas Partidas</div>
      {isLoading ? (
        <div className="matches-list">
          {[1, 2, 3].map(i => <SkeletonMatchCard key={i} />)}
        </div>
      ) : recentMatches && recentMatches.length > 0 ? (
        <>
          <div className="matches-list">
            {recentMatches.map(m => (
              <MatchCard key={m.id} match={m} onClick={() => navigate(`/matches/${m.id}`)} />
            ))}
          </div>
          {totalMatches > 5 && (
            <button className="btn btn-secondary btn-block mt-md" onClick={() => navigate('/matches')}>
              Ver todas as {totalMatches} partidas →
            </button>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><CircleDot size={48} /></div>
          <div className="empty-state-text">Nenhuma partida registrada ainda.<br />Cadastre sua primeira pelada!</div>
          {user ? (
            <button className="btn btn-primary" onClick={() => navigate('/matches/new')}>
              + Nova Partida
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Fazer Login
            </button>
          )}
        </div>
      )}

      {/* FAB */}
      {user && (
        <button className="fab" onClick={() => navigate('/matches/new')} aria-label="Criar nova partida">
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}
