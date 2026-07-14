import React from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { Dices, MessageSquare, Calendar, ArrowRightLeft, Settings, LogOut, LogIn, Zap, Trophy } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function MoreMenu() {
  const navigate = useNavigate();
  const { user, isAdmin } = useOutletContext();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const menuItems = [
    { icon: <Dices size={24} />, label: 'Sorteio de Times', desc: 'Monte os times da pelada', path: '/team-draw' },
    { icon: <MessageSquare size={24} />, label: 'Chat de Stats', desc: 'Pergunte sobre estatísticas', path: '/stats-chat' },
    { icon: <Calendar size={24} />, label: 'Próxima Pelada', desc: 'Presenças e sorteio rápido', path: '/next-match' },
    { icon: <ArrowRightLeft size={24} />, label: 'Confronto Direto', desc: 'Lado a lado de dois jogadores', path: '/head-to-head' },
  ];

  // Only Admin sees Settings
  if (isAdmin) {
    menuItems.push({ icon: <Settings size={24} />, label: 'Configurações', desc: 'API, backup, restrições', path: '/settings' });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={22} />
          <span>Mais</span>
        </h1>
      </div>

      {/* User Session Banner */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {user ? (
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conectado como:</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--green-primary)' }}>{user.email}</div>
            {isAdmin && (
              <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Trophy size={12} />
                <span>ADMINISTRADOR</span>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Acesso Limitado</div>
            <div className="text-sm text-muted">Faça login para cadastrar peladas e perfis</div>
          </div>
        )}

        {user ? (
          <button className="btn btn-danger btn-sm" onClick={handleLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <LogOut size={12} />
            <span>Sair</span>
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <LogIn size={12} />
            <span>Fazer Login</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {menuItems.map(item => (
          <div key={item.path} className="card card-clickable" onClick={() => navigate(item.path)}
            style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
            <span style={{ color: 'var(--green-primary)', display: 'flex', alignItems: 'center' }}>{item.icon}</span>
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
