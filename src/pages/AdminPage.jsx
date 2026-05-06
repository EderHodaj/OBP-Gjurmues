import { useState, useEffect } from 'react';
import { apiGetUsers, apiSetRole, apiDeleteUser } from '../utils/api';

async function apiResetPassword(id, newPassword) {
  const token = localStorage.getItem('obp_token');
  const res = await fetch(`/api/users/${id}/password`, {
    method: 'PUT',
    headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
    body: JSON.stringify({ password: newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gabim');
  return data;
}

export default function AdminPage({ currentUser }) {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [resetModal,  setResetModal]  = useState(null);  // { id, username }
  const [newPass,     setNewPass]     = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [resetMsg,    setResetMsg]    = useState('');
  const [resetLoading,setResetLoad]  = useState(false);

  useEffect(() => {
    apiGetUsers()
      .then(setUsers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function changeRole(id, role) {
    try {
      const updated = await apiSetRole(id, role);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: updated.role } : u));
    } catch (e) { alert('Gabim: ' + e.message); }
  }

  async function deleteUser(id, username) {
    if (!confirm(`Fshi përdoruesin "${username}"?`)) return;
    try {
      await apiDeleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e) { alert('Gabim: ' + e.message); }
  }

  async function handleResetPassword() {
    if (!newPass || newPass.length < 4) { setResetMsg('Fjalëkalimi duhet të ketë të paktën 4 karaktere.'); return; }
    setResetLoad(true);
    setResetMsg('');
    try {
      await apiResetPassword(resetModal.id, newPass);
      setResetMsg('✓ Fjalëkalimi u ndryshua me sukses!');
      setTimeout(() => { setResetModal(null); setNewPass(''); setResetMsg(''); }, 1500);
    } catch (e) {
      setResetMsg('Gabim: ' + e.message);
    } finally {
      setResetLoad(false);
    }
  }

  const roleBadge = role => {
    const cls = role === 'admin' ? 'badge-admin' : role === 'editor' ? 'badge-editor' : 'badge-viewer';
    return <span className={`role-badge ${cls}`}>{role}</span>;
  };

  if (loading) return <main className="page"><div className="loading-rows">Duke ngarkuar…</div></main>;

  return (
    <main className="page">
      <header className="page-hdr">
        <h1 className="page-title">⚙️ Menaxhimi i Përdoruesve</h1>
        <p className="page-sub">{users.length} përdorues të regjistruar</p>
      </header>

      {error && <div className="login-error">{error}</div>}

      {/* Role info */}
      <div className="admin-role-info">
        <div className="admin-role-card">
          <span className="role-badge badge-viewer">viewer</span>
          <p>Shikon tabelën dhe panelin. Shkarkon Excel. Nuk mund të editojë.</p>
        </div>
        <div className="admin-role-card">
          <span className="role-badge badge-editor">editor</span>
          <p>Redakton qeliza, shton dhe fshin rreshta. Nuk mund të importojë.</p>
        </div>
        <div className="admin-role-card">
          <span className="role-badge badge-admin">admin</span>
          <p>Akses i plotë: import, reset, menaxhim përdoruesish.</p>
        </div>
      </div>

      {/* Users table */}
      <div className="table-scroll">
        <table className="btable">
          <thead>
            <tr>
              <th>#</th>
              <th>Emri i Përdoruesit</th>
              <th>Roli Aktual</th>
              <th>Ndryshoni Rolin</th>
              <th>Fjalëkalimi</th>
              <th>Regjistruar më</th>
              <th>⊗</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className={u.id === currentUser?.id ? 'row-hi' : ''}>
                <td className="meta-txt">{i + 1}</td>
                <td style={{ fontWeight: 600 }}>
                  {u.username}
                  {u.id === currentUser?.id && <span style={{ color:'var(--accent)', marginLeft:8, fontSize:11 }}>(ju)</span>}
                </td>
                <td>{roleBadge(u.role)}</td>
                <td>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {['viewer','editor','admin'].map(role => (
                      u.role === role
                        ? <span key={role} className="btn-active-role">{role}</span>
                        : <button key={role} className="btn-role"
                            onClick={() => changeRole(u.id, role)}
                            disabled={u.id === currentUser?.id}>
                            → {role}
                          </button>
                    ))}
                  </div>
                </td>
                <td>
                  <button
                    className="btn btn-import"
                    style={{ fontSize:12, padding:'4px 12px' }}
                    onClick={() => { setResetModal({ id:u.id, username:u.username }); setNewPass(''); setResetMsg(''); setShowNewPass(false); }}
                  >
                    🔑 Reset
                  </button>
                </td>
                <td className="meta-txt">{u.created_at ? new Date(u.created_at).toLocaleDateString('sq-AL') : '—'}</td>
                <td>
                  {u.id !== currentUser?.id && (
                    <button className="btn-del" onClick={() => deleteUser(u.id, u.username)} title="Fshi përdoruesin">×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reset Password Modal */}
      {resetModal && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.6)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000,
        }}>
          <div className="login-card" style={{ maxWidth:380 }}>
            <h3 style={{ margin:'0 0 16px', color:'var(--text)' }}>
              🔑 Reset fjalëkalimi për <strong style={{ color:'var(--accent)' }}>{resetModal.username}</strong>
            </h3>

            <div className="login-field">
              <label>Fjalëkalimi i Ri</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  placeholder="Minimum 4 karaktere…"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                  disabled={resetLoading}
                  autoFocus
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(p => !p)}
                  style={{
                    position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer',
                    color:'var(--text-muted)', fontSize:16, padding:4,
                  }}
                >
                  {showNewPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {resetMsg && (
              <div className={resetMsg.startsWith('✓') ? 'iebar-status ok' : 'login-error'} style={{ marginBottom:12 }}>
                {resetMsg}
              </div>
            )}

            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button className="login-btn" onClick={handleResetPassword} disabled={resetLoading} style={{ flex:1 }}>
                {resetLoading ? 'Duke ndryshuar…' : '✓ Ndrysho Fjalëkalimin'}
              </button>
              <button
                onClick={() => { setResetModal(null); setNewPass(''); setResetMsg(''); }}
                style={{
                  background:'transparent', border:'1px solid var(--border)',
                  color:'var(--text-muted)', borderRadius:'var(--radius)',
                  padding:'0 16px', cursor:'pointer', fontFamily:'var(--font-main)',
                }}
              >
                Anulo
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
