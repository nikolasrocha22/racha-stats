import React from 'react';
import { NavLink } from 'react-router';

export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
        <span className="nav-icon">🏠</span>
        <span>Início</span>
      </NavLink>
      <NavLink to="/players" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">👥</span>
        <span>Jogadores</span>
      </NavLink>
      <NavLink to="/matches" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">⚽</span>
        <span>Partidas</span>
      </NavLink>
      <NavLink to="/rankings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🏆</span>
        <span>Rankings</span>
      </NavLink>
      <NavLink to="/more" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">⚡</span>
        <span>Mais</span>
      </NavLink>
    </nav>
  );
}
