import React from 'react';
import { NavLink } from 'react-router';
import { Home, Users, CircleDot, Trophy, MoreHorizontal } from 'lucide-react';

export default function Navbar({ user }) {
  return (
    <nav className="navbar glass-nav">
      <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon"><Home size={20} /></span>
        <span className="nav-label">Início</span>
      </NavLink>

      <NavLink to="/players" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon"><Users size={20} /></span>
        <span className="nav-label">Jogadores</span>
      </NavLink>

      <NavLink to="/matches" className={({ isActive }) => `nav-item nav-center-btn ${isActive ? 'active' : ''}`}>
        <span className="nav-icon"><CircleDot size={20} /></span>
        <span className="nav-label">Partidas</span>
      </NavLink>

      <NavLink to="/rankings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon"><Trophy size={20} /></span>
        <span className="nav-label">Rankings</span>
      </NavLink>

      <NavLink to="/more" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon"><MoreHorizontal size={20} /></span>
        <span className="nav-label">Mais</span>
      </NavLink>
    </nav>
  );
}
