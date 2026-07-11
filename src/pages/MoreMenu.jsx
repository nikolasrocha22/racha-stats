import React from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { supabase } from '../supabaseClient';

export default function MoreMenu() {
  const navigate = useNavigate();
  const { user, isAdmin } = useOutletContext();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const menuItems = [
    { icon: '🎲', label: 'Sorteio de Times', desc: 'Monte os times da pelada', path: '/team-draw' },
    { icon: '💬', label: 'Chat de Stats', desc: 'Pergunte sobre estatísticas', path: '/stats-chat' },
  ];

  // Only Admin sees Settings
  if (isAdmin) {
    menuItems.push({ icon: '⚙️', label: 'Configurações', desc: 'API, backup, restrições', path: '/settings' });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>⚡ Mais</h1>
      </div>

      {/* User Session Banner */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {user ? (
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conectado como:</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--green-primary)' }}>{user.email}</div>
            {isAdmin && <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 700 }}>🏆 ADMINISTRADOR</div>}
          </div>
        ) : (
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Acesso Limitado</div>
            <div className="text-sm text-muted">Faça login para cadastrar peladas e perfis</div>
          </div>
        )}

        {user ? (
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>Sair</button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>Fazer Login</button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {menuItems.map(item => (
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
