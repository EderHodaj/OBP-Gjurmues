import { useState, useEffect, useCallback, useRef } from 'react';
import { loadRows, saveRows, loadUsername, saveUsername, createBlankRow, resetToSeed } from '../utils/storage';
import { recalcRow } from '../utils/calculations';

const UNDO_LIMIT = 30;

export function useBudget() {
  const [rows, setRows]         = useState(() => loadRows());
  const [username, setUsername] = useState(() => loadUsername());
  const [lastEditedCell, setLEC]= useState(null);

  const history  = useRef([]);
  const canUndo  = history.current.length > 0;

  useEffect(() => { saveRows(rows); },       [rows]);
  useEffect(() => { saveUsername(username); }, [username]);

  function pushHistory(current) {
    history.current = [...history.current.slice(-UNDO_LIMIT), current];
  }

  // ── Undo ──────────────────────────────────────────────────
  const undo = useCallback(() => {
    if (history.current.length === 0) return;
    const prev = history.current[history.current.length - 1];
    history.current = history.current.slice(0, -1);
    setRows(prev);
    setLEC(null);
  }, []);

  // ── Global Ctrl+Z keyboard shortcut ───────────────────────
  useEffect(() => {
    function handleKeyDown(e) {
      // Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        // Don't interfere if user is typing in an input
        if (document.activeElement.tagName === 'INPUT' ||
            document.activeElement.tagName === 'TEXTAREA') return;
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  // ── Update cell ───────────────────────────────────────────
  const updateCell = useCallback((rowId, field, value) => {
    setRows(prev => {
      pushHistory(prev);
      return prev.map(row => {
        if (row.id !== rowId) return row;
        let v = value;
        if (['fondiLimit','vleraFituesit'].includes(field)) v = Math.max(0, parseFloat(value) || 0);
        if (['nrOfertave','nrOperatoreve'].includes(field)) v = Math.max(0, parseInt(value) || 0);
        if (field === 'year')           v = parseInt(value) || row.year;
        if (field === 'vitiShpalljes')  v = parseInt(value) || row.vitiShpalljes;
        if (field === 'vitiVleresimit') v = parseInt(value) || row.vitiVleresimit;
        let updated = {
          ...row, [field]: v,
          lastEditedAt: new Date().toISOString(),
          editedBy: username || 'Anonymous',
        };
        if (field === 'vitiShpalljes') updated.year = v;
        if (['fondiLimit','vleraFituesit'].includes(field)) updated = recalcRow(updated);
        return updated;
      });
    });
    setLEC({ rowId, field });
  }, [username]);

  // ── Toggle flag ───────────────────────────────────────────
  const toggleFlag = useCallback((rowId, flag) => {
    setRows(prev => {
      pushHistory(prev);
      return prev.map(row => {
        if (row.id !== rowId) return row;
        const on = !row[flag];
        const extra = {};
        if (flag === 'eAnulluar'   && on) extra.ePerfunduar = false;
        if (flag === 'ePerfunduar' && on) extra.eAnulluar   = false;
        return { ...row, [flag]: on, ...extra, lastEditedAt: new Date().toISOString(), editedBy: username || 'Anonymous' };
      });
    });
    setLEC({ rowId, field: flag });
  }, [username]);

  // ── Add / delete / replace / reset ───────────────────────
  const addRow = useCallback(() => {
    const yr = rows.length > 0 ? rows[0].year : 2026;
    setRows(prev => { pushHistory(prev); return [createBlankRow(yr), ...prev]; });
  }, [rows]);

  const deleteRow = useCallback((rowId) => {
    setRows(prev => { pushHistory(prev); return prev.filter(r => r.id !== rowId); });
    setLEC(c => c?.rowId === rowId ? null : c);
  }, []);

  const replaceRows = useCallback((nr) => {
    setRows(prev => { pushHistory(prev); return nr; });
    setLEC(null);
  }, []);

  const doReset = useCallback(() => {
    setRows(prev => { pushHistory(prev); return resetToSeed(); });
    setLEC(null);
  }, []);

  return {
    rows, username, setUsername,
    updateCell, toggleFlag,
    addRow, deleteRow, replaceRows, doReset,
    lastEditedCell,
    undo, canUndo,
  };
}
