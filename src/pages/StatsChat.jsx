import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { isAIConfigured, answerStatsQuestion } from '../ai';
import { getStatsSummaryForAI } from '../utils/stats';

const SUGGESTED = [
  'Quem é o artilheiro do ano?',
  'Qual jogador tem mais vitórias?',
  'Qual foi a maior goleada?',
  'Quem mais jogou?',
  'Qual o aproveitamento geral?',
];

export default function StatsChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const askQuestion = async (question) => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      const stats = await getStatsSummaryForAI();
      const answer = await answerStatsQuestion(q, stats);
      setMessages(prev => [...prev, { role: 'ai', text: answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: `❌ Erro: ${err.message}` }]);
    }
    setLoading(false);
  };

  if (!isAIConfigured()) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>💬 Chat de Stats</h1>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Voltar</button>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">🤖</div>
          <div className="empty-state-text">Configure a API key do Gemini nas Configurações para usar o chat.</div>
          <button className="btn btn-primary" onClick={() => navigate('/settings')}>⚙️ Configurações</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.1rem' }}>💬 Chat de Stats</h2>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Voltar</button>
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px', opacity: 0.5 }}>🤖</div>
            <p className="text-muted text-sm" style={{ marginBottom: '16px' }}>
              Pergunte qualquer coisa sobre as estatísticas das peladas!
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {SUGGESTED.map(q => (
                <button key={q} className="chip" onClick={() => askQuestion(q)}>{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
            {m.text}
          </div>
        ))}

        {loading && (
          <div className="chat-bubble chat-bubble-ai" style={{ opacity: 0.6 }}>
            <div className="loading-spinner" style={{ display: 'inline-block', width: '16px', height: '16px', marginRight: '8px', verticalAlign: 'middle' }} />
            Pensando...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-bar">
        <input
          className="form-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Faça sua pergunta..."
          onKeyDown={e => e.key === 'Enter' && askQuestion(input)}
          disabled={loading}
        />
        <button className="btn btn-primary" onClick={() => askQuestion(input)} disabled={loading || !input.trim()}>
          ➤
        </button>
      </div>
    </div>
  );
}
