// LoginPage.jsx — shown when user is not logged in
// Handles both login and registration in one page
import { useState } from 'react';

export default function LoginPage({ onLogin, onRegister }) {
  const [mode,     setMode]     = useState('login');  // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      return setError('Plotësoni të gjitha fushat.');
    }
    if (mode === 'register') {
      if (password.length < 4) return setError('Fjalëkalimi duhet të ketë të paktën 4 karaktere.');
      if (password !== confirm) return setError('Fjalëkalimet nuk përputhen.');
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await onLogin(username.trim(), password);
      } else {
        await onRegister(username.trim(), password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="nav-logo-block" style={{ justifyContent:'center', padding:'8px 16px' }}>
            <span className="nav-logo-icon">◈</span>
            <span className="nav-logo-text">OBP</span>
          </div>
          <p className="login-subtitle">Gjurmues Kursimesh</p>
        </div>

        {/* Tab switcher */}
        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
            type="button"
          >
            Hyrje
          </button>
          <button
            className={`login-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
            type="button"
          >
            Regjistrim
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>Emri i përdoruesit</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Shkruani emrin tuaj…"
              autoFocus
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label>Fjalëkalimi</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Fjalëkalimi…"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={loading}
            />
          </div>

          {mode === 'register' && (
            <div className="login-field">
              <label>Konfirmo fjalëkalimin</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Ripërsëritni fjalëkalimin…"
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
          )}

          {error && <div className="login-error">⚠️ {error}</div>}

          {mode === 'register' && (
            <div className="login-info">
              ℹ️ Llogaria e re fillon si <strong>Shikues</strong>. Administratori do ta promovojë në Editor nëse nevojitet.
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Duke u lidhur…' : mode === 'login' ? 'Hyrje' : 'Krijo llogari'}
          </button>
        </form>
      </div>
    </div>
  );
}
