import { useState, useEffect, useCallback } from 'react';
import { apiLogin, apiRegister, getToken, clearToken } from '../utils/api';

export function useAuth() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // On load — restore session from token and re-verify role from server
  useEffect(() => {
    const saved = localStorage.getItem('obp_token');
    if (saved) {
      try {
        const payload = JSON.parse(atob(saved.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          // Set user immediately from token so UI doesn't flash
          setUser({ id: payload.id, username: payload.username, role: payload.role });
          // Then verify current role from server (role may have changed since login)
          fetch('/api/me', {
            headers: { Authorization: `Bearer ${saved}` }
          })
          .then(r => r.json())
          .then(data => {
            if (data && data.role) {
              // Update role if it changed (e.g. admin promoted this user)
              setUser({ id: data.id, username: data.username, role: data.role });
              // Update token payload in memory (not the actual token)
            }
          })
          .catch(() => {}); // ignore network errors — keep token-based role
        } else {
          clearToken();
        }
      } catch { clearToken(); }
    }
    setLoading(false);
  }, []);

  async function login(username, password) {
    const data = await apiLogin(username, password);
    localStorage.setItem('obp_token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(username, password) {
    const data = await apiRegister(username, password);
    localStorage.setItem('obp_token', data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  const token    = localStorage.getItem('obp_token');
  const isAdmin  = user?.role === 'admin';
  const isEditor = user?.role === 'editor' || user?.role === 'admin';
  const isViewer = user?.role === 'viewer';

  return { user, token, loading, login, register, logout, isAdmin, isEditor, isViewer };
}
