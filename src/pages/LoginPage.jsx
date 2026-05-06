import { useState } from 'react';

export default function LoginPage({ onLogin, onRegister }) {
  const [tab,      setTab]      = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit() {
    setError('');
    if (!username.trim() || !password) { setError('Plotësoni të gjitha fushat.'); return; }
    if (tab === 'register') {
      if (password.length < 4) { setError('Fjalëkalimi duhet të ketë të paktën 4 karaktere.'); return; }
      if (password !== confirm) { setError('Fjalëkalimet nuk përputhen.'); return; }
    }
    setLoading(true);
    try {
      if (tab === 'login') await onLogin(username.trim(), password);
      else                 await onRegister(username.trim(), password);
    } catch (e) {
      setError(e.message || 'Gabim. Provoni sërish.');
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) { if (e.key === 'Enter') handleSubmit(); }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="btn btn-primary" style={{ pointerEvents:'none', fontSize:18, padding:'10px 28px' }}>◈ OBP</div>
          <p className="login-subtitle">Gjurmues Kursimesh — Prokurimi Publik</p>
        </div>

        <div className="login-tabs">
          <button className={`login-tab${tab==='login'?' active':''}`}    onClick={() => { setTab('login');    setError(''); }}>Hyrje</button>
          <button className={`login-tab${tab==='register'?' active':''}`} onClick={() => { setTab('register'); setError(''); }}>Regjistrim</button>
        </div>

        <div className="login-form">
          <div className="login-field">
            <label>Emri i Përdoruesit</label>
            <input
              type="text"
              placeholder="Shkruani emrin tuaj…"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="login-field">
            <label>Fjalëkalimi</label>
            <div style={{ position:'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Fjalëkalimi…"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer',
                  color:'var(--text-muted)', fontSize:16, padding:4,
                }}
                title={showPass ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div className="login-field">
              <label>Konfirmo Fjalëkalimin</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showConf ? 'text' : 'password'}
                  placeholder="Konfirmo fjalëkalimin…"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={loading}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConf(p => !p)}
                  style={{
                    position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer',
                    color:'var(--text-muted)', fontSize:16, padding:4,
                  }}
                  title={showConf ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'}
                >
                  {showConf ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}

          {error && <div className="login-error">{error}</div>}

          {tab === 'register' && (
            <div className="login-info">
              ℹ️ Të gjithë përdoruesit e rinj fillojnë si <strong>Viewer</strong> (vetëm lexim).
              Administratori mund t'ju promovojë në <strong>Editor</strong>.
            </div>
          )}

          <button className="login-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Duke u ngarkuar…' : tab === 'login' ? 'Hyrje' : 'Regjistrohu'}
          </button>
        </div>
      </div>
    </div>
  );
}
