import React from 'react';
import { NavLink } from 'react-router';

const navItems = [
  { to: '/', label: 'Início', end: true, icon: 'home' },
  { to: '/players', label: 'Jogadores', icon: 'users' },
  { to: '/matches', label: 'Partidas', icon: 'ball' },
  { to: '/rankings', label: 'Rankings', icon: 'chart' },
  { to: '/more', label: 'Mais', icon: 'more' },
];

function NavIcon({ name }) {
  const paths = {
    home: <><path d="M3 11.5 12 4l9 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M5.5 10v10h13V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M9.5 20v-6h5v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    users: <><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M3.5 20v-1.5A5.5 5.5 0 0 1 9 13h0a5.5 5.5 0 0 1 5.5 5.5V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M15 5.2a3 3 0 0 1 0 5.6M17 13.5a5 5 0 0 1 3.5 4.8V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    ball: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="m9 9 3-2 3 2-1 3.5h-4L9 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="m12 7-.5-4M15 9l4-1M14 12.5l2.5 3.5M10 12.5 7.5 16M9 9 5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    chart: <><path d="M5 20V10M12 20V4M19 20v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M3 20h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    more: <><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></>,
  };
  return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true" style={{ width: '24px', height: '24px' }}>{paths[name]}</svg>;
}

export default function Navbar({ user }) {
  return (
    <nav className="navbar" aria-label="Navegação principal">
      <div className="nav-brand" aria-label="Racha Stats">
        <span className="nav-brand-mark">RS</span>
        <span className="nav-brand-copy"><strong>Racha</strong><small>Stats</small></span>
      </div>
      <div className="nav-links">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="nav-season"><span className="live-dot" /> Temporada ativa</div>
    </nav>
  );
}
