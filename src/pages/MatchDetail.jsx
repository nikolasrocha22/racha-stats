import React from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router';
import { getMatchDetails, deleteMatch, db } from '../db';
import { formatDate, getInitials } from '../utils/formatters';
import { isAIConfigured, generateMatchSummary } from '../ai';

export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useOutletContext();
  const [match, setMatch] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [generatingAI, setGeneratingAI] = React.useState(false);

  const load = async () => {
    const m = await getMatchDetails(Number(id));
    setMatch(m);
    setLoading(false);
  };

  React.useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta partida?')) return;
    await deleteMatch(Number(id));
    navigate('/matches');
  };

  const handleGenerateSummary = async () => {
    setGeneratingAI(true);
    try {
      const matchData = {
        date: match.date,
        location: match.location,
        teamA: { name: match.teamAName, score: match.scoreA, players: match.lineupA?.map(p => p.nickname || p.name) },
        teamB: { name: match.teamBName, score: match.scoreB, players: match.lineupB?.map(p => p.nickname || p.name) },
        goals: match.goals?.map(g => ({
          scorer: g.scorer?.nickname || g.scorer?.name,
          assist: g.assistant?.nickname || g.assistant?.name || null,
          team: g.team === 'A' ? match.teamAName : match.teamBName
        }))
      };
      const summary = await generateMatchSummary(matchData);
      await db.matches.update(Number(id), { aiSummary: summary });
      setMatch({ ...match, aiSummary: summary });
    } catch (err) {
      alert('Erro ao gerar resumo: ' + err.message);
    }
    setGeneratingAI(false);
  };

  if (loading) return <div className="page"><div className="loading"><div className="loading-spinner" /> Carregando...</div></div>;
  if (!match) return <div className="page"><div className="empty-state"><div className="empty-state-text">Partida não encontrada.</div></div></div>;

  const winner = match.scoreA > match.scoreB ? 'A' : match.scoreB > match.scoreA ? 'B' : null;

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/matches')}>← Voltar</button>
        <div style={{ display: 'flex', gap: '8px' }}>
          {user && (
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/matches/${id}/edit`)}>✏️</button>
          )}
          {isAdmin && (
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑️</button>
          )}
        </div>
      </div>

      {/* Score header */}
      <div className="card" style={{ marginBottom: '24px', textAlign: 'center', padding: '24px 16px' }}>
        <div className="text-sm text-muted mb-sm">
          📅 {formatDate(match.date)} {match.location && ` • 📍 ${match.location}`}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="match-card-team-dot" style={{ background: match.teamAColor }} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>{match.teamAName}</span>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '3rem', fontWeight: 700,
              color: winner === 'A' ? 'var(--green-primary)' : 'var(--text-primary)'
            }}>
              {match.scoreA}
            </div>
          </div>
          <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 700 }}>✕</span>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>{match.teamBName}</span>
              <span className="match-card-team-dot" style={{ background: match.teamBColor }} />
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '3rem', fontWeight: 700,
              color: winner === 'B' ? 'var(--green-primary)' : 'var(--text-primary)'
            }}>
              {match.scoreB}
            </div>
          </div>
        </div>
      </div>

      {/* Lineups */}
      <div className="section-title">Escalações</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: match.teamAColor, marginBottom: '8px', textAlign: 'center' }}>
            {match.teamAName}
          </div>
          {match.lineupA?.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}
              onClick={() => navigate(`/players/${p.id}`)}>
              {p.photo ? (
                <img src={p.photo} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span className="checkbox-item-avatar">{getInitials(p.name)}</span>
              )}
              <span style={{ fontSize: '0.8rem' }}>{p.nickname || p.name}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: match.teamBColor, marginBottom: '8px', textAlign: 'center' }}>
            {match.teamBName}
          </div>
          {match.lineupB?.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}
              onClick={() => navigate(`/players/${p.id}`)}>
              {p.photo ? (
                <img src={p.photo} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span className="checkbox-item-avatar">{getInitials(p.name)}</span>
              )}
              <span style={{ fontSize: '0.8rem' }}>{p.nickname || p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Goals */}
      {match.goals?.length > 0 && (
        <>
          <div className="section-title">Gols</div>
          <div className="goal-timeline" style={{ marginBottom: '24px' }}>
            {match.goals.map((g, i) => (
              <div key={i} className="goal-item">
                <span className="goal-icon">⚽</span>
                <div className="goal-info">
                  <div className="goal-scorer">
                    {g.scorer?.nickname || g.scorer?.name || 'Desconhecido'}
                    <span style={{ fontSize: '0.7rem', color: g.team === 'A' ? match.teamAColor : match.teamBColor, marginLeft: '8px' }}>
                      {g.team === 'A' ? match.teamAName : match.teamBName}
                    </span>
                  </div>
                  {g.assistant && (
                    <div className="goal-assist">
                      🅰️ Assistência: {g.assistant.nickname || g.assistant.name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* AI Summary */}
      <div className="section-title">Resumo IA</div>
      {match.aiSummary ? (
        <div className="ai-summary" style={{ marginBottom: '16px' }}>{match.aiSummary}</div>
      ) : isAIConfigured() ? (
        <button className="btn btn-secondary btn-block" onClick={handleGenerateSummary} disabled={generatingAI}>
          {generatingAI ? '✨ Gerando resumo...' : '✨ Gerar Resumo com IA'}
        </button>
      ) : (
        <div className="text-sm text-muted text-center">
          Configure a API key do Gemini nas ⚙️ Configurações para gerar resumos.
        </div>
      )}
    </div>
  );
}
