// utils/api.js — all HTTP calls to the server
// Using relative URLs so the Vite proxy handles routing.
// This means the React app and server can be on different ports
// but users only need one IP address.

export const SERVER_URL = '';  // empty = relative, uses Vite proxy

export function getToken()       { return localStorage.getItem('obp_token'); }
export function clearToken()     { localStorage.removeItem('obp_token'); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res   = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gabim serveri');
  return data;
}

export const apiRegister   = (u, p)    => apiFetch('/api/register',         { method:'POST',   body: JSON.stringify({ username:u, password:p }) });
export const apiLogin      = (u, p)    => apiFetch('/api/login',            { method:'POST',   body: JSON.stringify({ username:u, password:p }) });
export const apiGetRows    = ()        => apiFetch('/api/rows');
export const apiGetUpdate  = ()        => apiFetch('/api/rows/lastupdate');
export const apiUpdateRow  = (id,f,v)  => apiFetch(`/api/rows/${id}`,       { method:'PUT',    body: JSON.stringify({ field:f, value:v }) });
export const apiToggleFlag = (id,flag) => apiFetch(`/api/rows/${id}/flag`,  { method:'PUT',    body: JSON.stringify({ flag }) });
export const apiAddRow     = (row)     => apiFetch('/api/rows',             { method:'POST',   body: JSON.stringify(row) });
export const apiDeleteRow  = (id)      => apiFetch(`/api/rows/${id}`,       { method:'DELETE' });
export const apiImportRows = (rows)    => apiFetch('/api/rows/import',      { method:'POST',   body: JSON.stringify({ rows }) });
export const apiReset       = ()       => apiFetch('/api/rows/reset',       { method:'POST' });
export const apiRestoreRow  = (row)    => apiFetch('/api/rows/restore',     { method:'POST',   body: JSON.stringify(row) });
export const apiGetUsers   = ()        => apiFetch('/api/users');
export const apiSetRole    = (id,role) => apiFetch(`/api/users/${id}/role`, { method:'PUT',    body: JSON.stringify({ role }) });
export const apiDeleteUser = (id)      => apiFetch(`/api/users/${id}`,      { method:'DELETE' });
