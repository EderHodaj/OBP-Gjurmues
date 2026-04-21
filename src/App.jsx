import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar        from './components/Navbar';
import TablePage     from './pages/TablePage';
import DashboardPage from './pages/DashboardPage';
import LoginPage     from './pages/LoginPage';
import AdminPage     from './pages/AdminPage';
import { useBudget } from './hooks/useBudget';
import { useAuth   } from './hooks/useAuth';
import './App.css';

export default function App() {
  const { user, token, loading: authLoading, login, register, logout, isAdmin, isEditor } = useAuth();

  const {
    rows, loading: dataLoading, serverError,
    updateCell, toggleFlag, addRow, deleteRow, replaceRows, doReset,
    lastEditedCell, undo, canUndo,
  } = useBudget(token);

  // While checking saved session, show nothing
  if (authLoading) return (
    <div className="app-loading">
      <div className="app-loading-inner">
        <span className="nav-logo-icon" style={{fontSize:32}}>◈</span>
        <p>Duke ngarkuar…</p>
      </div>
    </div>
  );

  // Not logged in → show login/register page
  if (!user) return (
    <LoginPage onLogin={login} onRegister={register} />
  );

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={logout} isAdmin={isAdmin} />

      {/* Server offline banner */}
      {serverError && (
        <div className="server-error-banner">
          ⚠️ {serverError}
        </div>
      )}

      <Routes>
        <Route path="/" element={
          <TablePage
            rows={rows}
            loading={dataLoading}
            user={user}
            isEditor={isEditor}
            isAdmin={isAdmin}
            onUpdateCell={updateCell}
            onToggleFlag={toggleFlag}
            onAddRow={addRow}
            onDeleteRow={deleteRow}
            onImport={replaceRows}
            onReset={doReset}
            onUndo={undo}
            canUndo={canUndo}
            lastEditedCell={lastEditedCell}
          />
        } />
        <Route path="/dashboard" element={<DashboardPage rows={rows} />} />
        <Route path="/admin"     element={
          isAdmin ? <AdminPage token={token} currentUser={user} /> : <Navigate to="/" />
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
