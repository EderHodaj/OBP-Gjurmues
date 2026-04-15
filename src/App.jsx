import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar        from './components/Navbar';
import TablePage     from './pages/TablePage';
import DashboardPage from './pages/DashboardPage';
import { useBudget } from './hooks/useBudget';
import './App.css';

export default function App() {
  const {
    rows, username, setUsername,
    updateCell, toggleFlag,
    addRow, deleteRow, replaceRows, doReset,
    lastEditedCell,
    undo, canUndo,       // ← wired up
  } = useBudget();

  return (
    <BrowserRouter>
      <Navbar username={username} onUsernameChange={setUsername} />
      <Routes>
        <Route path="/" element={
          <TablePage
            rows={rows} username={username}
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
      </Routes>
    </BrowserRouter>
  );
}
