import React from 'react';
import { NavLink } from 'react-router';
import { CircleDot, Trophy, Users, Zap } from 'lucide-react';

export default function Navbar({ user }) {
  return (
    <nav className="navbar glass-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon"><CircleDot size={20} /></span>
        <span className="nav-label">Partidas</span>
      </NavLink>

      <NavLink to="/rankings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon"><Trophy size={20} /></span>
        <span className="nav-label">Rankings</span>
      </NavLink>

      <NavLink to="/players" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon"><Users size={20} /></span>
        <span className="nav-label">Jogadores</span>
      </NavLink>

      <NavLink to="/more" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon"><Zap size={20} /></span>
        <span className="nav-label">Mais</span>
      </NavLink>
    </nav>
  );
}
