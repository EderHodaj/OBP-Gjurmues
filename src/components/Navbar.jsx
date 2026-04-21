// Navbar — shows user info, role badge, logout, admin link
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ user, onLogout, isAdmin }) {
  const loc    = useLocation();
  const active = (path) => loc.pathname === path ? 'nav-link active' : 'nav-link';

  const roleBadge = {
    admin:  { label: 'Admin',   cls: 'badge-admin'  },
    editor: { label: 'Editor',  cls: 'badge-editor' },
    viewer: { label: 'Shikues', cls: 'badge-viewer' },
  }[user?.role] || { label: user?.role, cls: '' };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="nav-logo-block">
          <span className="nav-logo-icon">◈</span>
          <span className="nav-logo-text">OBP</span>
        </div>
        <span className="nav-subtitle">Gjurmues Kursimesh</span>
      </div>

      <div className="nav-links">
        <Link to="/"          className={active('/')}>📋 Tabela</Link>
        <Link to="/dashboard" className={active('/dashboard')}>📊 Paneli</Link>
        {isAdmin && (
          <Link to="/admin" className={active('/admin')}>⚙️ Admin</Link>
        )}
      </div>

      <div className="nav-user">
        <span className="nav-user-name">👤 {user?.username}</span>
        <span className={`role-badge ${roleBadge.cls}`}>{roleBadge.label}</span>
        <button className="btn-logout" onClick={onLogout} title="Dilni">
          Dil →
        </button>
      </div>
    </nav>
  );
}
