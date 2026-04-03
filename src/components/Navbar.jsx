// components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ username, onUsernameChange }) {
  const loc = useLocation();
  const active = (path) => loc.pathname === path ? 'nav-link active' : 'nav-link';

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
        <Link to="/"          className={active('/')}>          📋 Tabela</Link>
        <Link to="/dashboard" className={active('/dashboard')}> 📊 Paneli</Link>
      </div>

      <div className="nav-user">
        <span className="nav-user-label">Përdoruesi:</span>
        <input
          type="text"
          className="nav-user-input"
          placeholder="Emri juaj…"
          value={username}
          onChange={e => onUsernameChange(e.target.value)}
          maxLength={40}
        />
      </div>
    </nav>
  );
}
