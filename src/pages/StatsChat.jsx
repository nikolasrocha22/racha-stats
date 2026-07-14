import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { answerStatsQuestion } from '../ai';
import { getStatsSummaryForAI } from '../utils/stats';

const SUGGESTED = [
  'Quem é o artilheiro do ano?',
  'Qual jogador tem mais vitórias?',
  'Qual foi a maior goleada?',
  'Quem mais jogou?',
  'Qual o aproveitamento geral?',
  'Compare os dois melhores jogadores',
];

// Simple markdown renderer for AI responses
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="chat-md-list">
          {listItems.map((item, i) => <li key={i}>{processInline(item)}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  const processInline = (line) => {
    // Bold **text**
    const parts = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index}>{match[1]}</strong>);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    return parts.length > 0 ? parts : line;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('- ') || line.startsWith('• ')) {
      listItems.push(line.substring(2));
      continue;
    }

    flushList();

    if (!line) {
      elements.push(<br key={`br-${i}`} />);
    } else {
      elements.push(<p key={`p-${i}`} className="chat-md-paragraph">{processInline(line)}</p>);
    }
  }
  flushList();

  return elements;
}

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

  return (
    <div className="page" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)' }}>
      {/* Header */}
      <div className="chat-header">
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
            {m.role === 'ai' ? renderMarkdown(m.text) : m.text}
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
