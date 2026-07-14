import React from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { db, useLiveQuery, getSystemConfig } from '../db';
import { getCraqueDaRodada, getAllPlayerStats } from '../utils/stats';
import MatchCard from '../components/MatchCard';
import { getInitials } from '../utils/formatters';

const highlightMeta = {
  muralha: { eyebrow: 'Dono do racha', stat: item => `${item.winRate}% de aproveitamento` },
  artilheiro: { eyebrow: 'Artilheiro', stat: item => `${item.goals} gol${item.goals !== 1 ? 's' : ''}` },
  garcom: { eyebrow: 'Garçom', stat: item => `${item.assists} assistência${item.assists !== 1 ? 's' : ''}` },
  pernaDePau: { eyebrow: 'Lanterna', stat: item => `${item.losses} derrota${item.losses !== 1 ? 's' : ''}` },
};

function getCountdown(dateValue) {
  if (!dateValue) return null;
  const nextMatch = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(nextMatch.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextMatch.setHours(0, 0, 0, 0);

  const days = Math.ceil((nextMatch - today) / 86400000);
  if (days < 0) return null;
  return { days, date: nextMatch };
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const matches = useLiveQuery(() => db.matches.orderBy('date').reverse().limit(5).toArray());
  const players = useLiveQuery(() => db.players.toArray());
  const allGoals = useLiveQuery(() => db.goals.toArray());
  const [craque, setCraque] = React.useState(null);
  const [nextMatchDate, setNextMatchDate] = React.useState(null);
  const [highlights, setHighlights] = React.useState({ artilheiro: null, garcom: null, muralha: null, pernaDePau: null });

  React.useEffect(() => { getCraqueDaRodada().then(setCraque); }, [matches]);
  React.useEffect(() => { getSystemConfig('next_match_date').then(setNextMatchDate); }, []);
  React.useEffect(() => {
    getAllPlayerStats().then(allStats => {
      if (!allStats?.length) return;
      setHighlights({
        artilheiro: [...allStats].filter(s => s.goals > 0).sort((a, b) => b.goals - a.goals)[0] || null,
        garcom: [...allStats].filter(s => s.assists > 0).sort((a, b) => b.assists - a.assists)[0] || null,
        muralha: [...allStats].filter(s => s.games >= 3 && s.winRate > 0).sort((a, b) => b.winRate - a.winRate)[0] || null,
        pernaDePau: [...allStats].filter(s => s.losses > 0).sort((a, b) => b.losses - a.losses)[0] || null,
      });
    });
  }, [players]);

  const highlightEntries = Object.entries(highlights).filter(([, value]) => value);
  const countdown = getCountdown(nextMatchDate);
  const goToCraque = () => navigate(`/players/${craque.player.id}`);

  return (
    <main className="page home-page">
      <section className="home-hero">
        <div>
          <span className="eyebrow"><span className="live-dot" /> Central do racha</span>
          <h1>O jogo acaba.<br /><span>Os números ficam.</span></h1>
          <p>Partidas, rankings e resenha em um só lugar.</p>
        </div>
        <button className="btn btn-primary hero-action" onClick={() => navigate(user ? '/matches/new' : '/login')}>
          {user ? 'Registrar partida' : 'Entrar no racha'} <span aria-hidden="true">→</span>
        </button>
      </section>

      {countdown && (
        <section className="next-match-countdown" aria-label="Contagem regressiva para a próxima partida">
          <div>
            <span className="countdown-label">Próxima partida</span>
            <strong>{countdown.days === 0 ? 'É hoje' : `Faltam ${countdown.days} dia${countdown.days !== 1 ? 's' : ''}`}</strong>
            <time dateTime={nextMatchDate}>{countdown.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</time>
          </div>
          <span className="countdown-number" aria-hidden="true">{countdown.days}</span>
        </section>
      )}

      <section className="stats-grid home-stats" aria-label="Resumo geral">
        {[['Partidas', matches?.length || 0], ['Jogadores', players?.length || 0], ['Gols marcados', allGoals?.length || 0]].map(([label, value]) => (
          <article className="stat-card" key={label}><div className="stat-card-value">{value}</div><div className="stat-card-label">{label}</div></article>
        ))}
      </section>

      {highlightEntries.length > 0 && (
        <section className="home-section">
          <div className="section-heading"><div><span className="eyebrow">Radar da temporada</span><h2>Destaques do racha</h2></div><button className="text-link" onClick={() => navigate('/rankings')}>Ver ranking →</button></div>
          <div className="highlights-grid">
            {highlightEntries.map(([key, item]) => {
              const meta = highlightMeta[key];
              return <button className={`highlight-card highlight-${key}`} key={key} onClick={() => navigate(`/players/${item.player.id}`)}><span className="highlight-label">{meta.eyebrow}</span><strong>{item.player.nickname || item.player.name}</strong><small>{meta.stat(item)}</small></button>;
            })}
          </div>
        </section>
      )}

      {craque && (
        <section className="home-section">
          <div className="section-heading"><div><span className="eyebrow">Última rodada</span><h2>Craque da partida</h2></div></div>
          <button className="craque-card" onClick={goToCraque}>
            <span className="craque-number">MVP</span>
            <div className="craque-profile">
              {craque.player.photo ? <img src={craque.player.photo} alt={craque.player.name} className="profile-photo" /> : <div className="profile-avatar">{getInitials(craque.player.name)}</div>}
              <div><span className="craque-label">Melhor em campo</span><div className="craque-name">{craque.player.nickname || craque.player.name}</div><div className="craque-stat">{craque.goals} gol{craque.goals !== 1 ? 's' : ''} na última partida</div></div>
            </div>
            <span className="craque-arrow" aria-hidden="true">→</span>
          </button>
        </section>
      )}

      <section className="home-section">
        <div className="section-heading"><div><span className="eyebrow">Resultados</span><h2>Últimas partidas</h2></div><button className="text-link" onClick={() => navigate('/matches')}>Ver todas →</button></div>
        {matches?.length ? <div className="matches-list">{matches.map(match => <MatchCard key={match.id} match={match} onClick={() => navigate(`/matches/${match.id}`)} />)}</div> : <div className="empty-state"><span className="empty-state-mark">RS</span><h3>O placar está zerado</h3><p className="empty-state-text">Cadastre a primeira partida para começar o histórico.</p><button className="btn btn-primary" onClick={() => navigate(user ? '/matches/new' : '/login')}>{user ? 'Nova partida' : 'Fazer login'}</button></div>}
      </section>

      {user && <button className="fab" onClick={() => navigate('/matches/new')} aria-label="Nova partida"><span aria-hidden="true">+</span></button>}
    </main>
  );
}
