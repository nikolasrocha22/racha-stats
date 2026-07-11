import React from 'react';
import { useNavigate } from 'react-router';

const ITEMS = [
  { icon: '🎲', label: 'Sorteio de Times', desc: 'Monte os times da pelada', path: '/team-draw' },
  { icon: '💬', label: 'Chat de Stats', desc: 'Pergunte sobre estatísticas', path: '/stats-chat' },
  { icon: '⚙️', label: 'Configurações', desc: 'API, backup, restrições', path: '/settings' },
];

export default function MoreMenu() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="page-header">
        <h1>⚡ Mais</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {ITEMS.map(item => (
          <div key={item.path} className="card card-clickable" onClick={() => navigate(item.path)}
            style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
            <span style={{ fontSize: '2rem' }}>{item.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.label}</div>
              <div className="text-sm text-muted">{item.desc}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→</span>
          </div>
        ))}
      </div>
    </div>
  );
}
