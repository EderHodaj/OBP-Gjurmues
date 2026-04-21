// AdminPage — only accessible by admin role
// Lets admin view all users and promote/demote roles
import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function AdminPage({ token, currentUser }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState(null); // { type: 'ok'|'err', text }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  async function fetchUsers() {
    try {
      const res  = await fetch(`${API}/users`, { headers });
      const data = await res.json();
      setUsers(data);
    } catch {
      setMsg({ type: 'err', text: 'Nuk mund të ngarkohen përdoruesit.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  async function changeRole(id, role) {
    try {
      const res  = await fetch(`${API}/users/${id}/role`, {
        method: 'PUT', headers,
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
      setMsg({ type: 'ok', text: `✓ Roli u ndryshua me sukses.` });
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  async function deleteUser(id, username) {
    if (!window.confirm(`Jeni i sigurt që doni të fshini "${username}"?`)) return;
    try {
      const res = await fetch(`${API}/users/${id}`, { method: 'DELETE', headers });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setUsers(prev => prev.filter(u => u.id !== id));
      setMsg({ type: 'ok', text: `✓ Përdoruesi "${username}" u fshi.` });
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    }
  }

  const roleLabel = { admin: '👑 Admin', editor: '✏️ Editor', viewer: '👁️ Shikues' };
  const roleColor = { admin: 'badge-admin', editor: 'badge-editor', viewer: 'badge-viewer' };

  return (
    <main className="page">
      <header className="page-hdr">
        <h1 className="page-title">⚙️ Menaxhimi i Përdoruesve</h1>
        <p className="page-sub">
          Këtu mund të ndryshoni rolet e përdoruesve. Roli i paracaktuar pas regjistrimit është <strong>Shikues</strong>.
        </p>
      </header>

      {msg && (
        <div className={`iebar-status ${msg.type}`} style={{ marginBottom:16, display:'flex', justifyContent:'space-between' }}>
          {msg.text}
          <button className="iebar-close" onClick={() => setMsg(null)}>×</button>
        </div>
      )}

      <div className="admin-role-info">
        <div className="admin-role-card">
          <span className="role-badge badge-viewer">Shikues</span>
          <p>Shikon tabelën dhe panelin. Nuk mund të redaktojë asgjë.</p>
        </div>
        <div className="admin-role-card">
          <span className="role-badge badge-editor">Editor</span>
          <p>Mund të redaktojë, shtojë, fshijë dhe importojë të dhëna.</p>
        </div>
        <div className="admin-role-card">
          <span className="role-badge badge-admin">Admin</span>
          <p>Të gjitha të drejtat + menaxhimi i përdoruesve.</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color:'var(--text-muted)', padding:'20px 0' }}>Duke ngarkuar…</p>
      ) : (
        <div className="table-scroll">
          <table className="btable">
            <thead>
              <tr>
                <th>#</th>
                <th>Emri i përdoruesit</th>
                <th>Roli aktual</th>
                <th>Regjistruar më</th>
                <th>Ndrysho rolin</th>
                <th>Fshi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className={u.id === currentUser.id ? 'row-completed' : ''}>
                  <td style={{ padding:'8px 12px', color:'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ padding:'8px 12px', fontWeight: u.id === currentUser.id ? 600 : 400 }}>
                    {u.username}
                    {u.id === currentUser.id && <span style={{ color:'var(--text-muted)', fontSize:11, marginLeft:6 }}>(ju)</span>}
                  </td>
                  <td style={{ padding:'8px 12px' }}>
                    <span className={`role-badge ${roleColor[u.role]}`}>{roleLabel[u.role]}</span>
                  </td>
                  <td style={{ padding:'8px 12px', color:'var(--text-muted)', fontSize:12 }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('sq-AL') : '—'}
                  </td>
                  <td style={{ padding:'8px 12px' }}>
                    {u.id !== currentUser.id ? (
                      <div style={{ display:'flex', gap:6 }}>
                        {['viewer','editor','admin'].map(r => (
                          <button
                            key={r}
                            className={`btn ${r === u.role ? 'btn-active-role' : 'btn-role'}`}
                            onClick={() => changeRole(u.id, r)}
                            disabled={r === u.role}
                          >
                            {roleLabel[r]}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color:'var(--text-muted)', fontSize:12 }}>Nuk mund ta ndryshoni rolin tuaj</span>
                    )}
                  </td>
                  <td style={{ padding:'8px 12px', textAlign:'center' }}>
                    {u.id !== currentUser.id ? (
                      <button className="btn-del" onClick={() => deleteUser(u.id, u.username)} title="Fshi">×</button>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
