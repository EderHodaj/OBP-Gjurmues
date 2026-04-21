// useBudget.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { recalcRow } from '../utils/calculations';
import {
  apiGetRows, apiGetUpdate,
  apiUpdateRow, apiToggleFlag,
  apiAddRow, apiDeleteRow,
  apiImportRows, apiReset,
  apiRestoreRow,
} from '../utils/api';

const POLL_MS = 5000;

// Simple UUID generator — works in all browsers including non-HTTPS
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    const an = (a.nr == null) ? Infinity : Number(a.nr);
    const bn = (b.nr == null) ? Infinity : Number(b.nr);
    return bn - an;
  });
}

export function useBudget(token) {
  const [rows,          setRows]    = useState([]);
  const [loading,       setLoading] = useState(true);
  const [serverError,   setError]   = useState(null);
  const [lastEditedCell,setLEC]     = useState(null);

  const lastUpdateRef = useRef(null);
  const pendingRef    = useRef(0);

  // History stores objects: { type, data }
  // type: 'delete' → data: the deleted row
  // type: 'update' → data: { rowId, field, oldValue }
  // type: 'add'    → data: { rowId }
  // type: 'toggle' → data: { rowId, flag, oldVal }
  const history = useRef([]);
  const canUndo = history.current.length > 0;

  // ── Fetch all rows ──────────────────────────────────────────
  const fetchRows = useCallback(async (silent = false) => {
    try {
      const data = await apiGetRows();
      lastUpdateRef.current = data.lastUpdate;
      setRows(sortRows(data.rows));
      setError(null);
    } catch {
      setError('Serveri nuk është i disponueshëm. Sigurohuni që server.js është duke ekzekutuar.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) fetchRows(false); }, [token]);

  // ── Polling ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const id = setInterval(async () => {
      if (pendingRef.current > 0) return;
      try {
        const data = await apiGetUpdate();
        if (data.lastUpdate && data.lastUpdate !== lastUpdateRef.current) {
          await fetchRows(true);
        }
      } catch {}
    }, POLL_MS);
    return () => clearInterval(id);
  }, [token, fetchRows]);

  // ── Undo ────────────────────────────────────────────────────
  const undo = useCallback(async () => {
    if (!history.current.length) return;
    const last = history.current.pop();

    pendingRef.current += 1;
    try {
      if (last.type === 'delete') {
        // Restore the deleted row on server
        await apiRestoreRow(last.data);
        // Update local state
        setRows(prev => sortRows([last.data, ...prev]));
        const ts = await apiGetUpdate();
        lastUpdateRef.current = ts.lastUpdate;

      } else if (last.type === 'update') {
        // Revert the field to old value on server
        await apiUpdateRow(last.data.rowId, last.data.field, last.data.oldValue);
        setRows(prev => prev.map(row => {
          if (row.id !== last.data.rowId) return row;
          let u = { ...row, [last.data.field]: last.data.oldValue };
          if (['fondiLimit','vleraFituesit'].includes(last.data.field)) u = recalcRow(u);
          return u;
        }));
        const ts = await apiGetUpdate();
        lastUpdateRef.current = ts.lastUpdate;

      } else if (last.type === 'toggle') {
        // Revert flag toggle on server
        await apiToggleFlag(last.data.rowId, last.data.flag);
        setRows(prev => prev.map(row => {
          if (row.id !== last.data.rowId) return row;
          return { ...row, [last.data.flag]: last.data.oldVal };
        }));
        const ts = await apiGetUpdate();
        lastUpdateRef.current = ts.lastUpdate;

      } else if (last.type === 'add') {
        // Delete the added row from server
        await apiDeleteRow(last.data.rowId);
        setRows(prev => prev.filter(r => r.id !== last.data.rowId));
        const ts = await apiGetUpdate();
        lastUpdateRef.current = ts.lastUpdate;
      }
    } catch {
      await fetchRows(true);
    } finally {
      pendingRef.current -= 1;
    }
    setLEC(null);
  }, [fetchRows]);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
        e.preventDefault(); undo();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo]);

  // ── Update cell ─────────────────────────────────────────────
  const updateCell = useCallback(async (rowId, field, value) => {
    // Save old value for undo
    const currentRow = rows.find(r => r.id === rowId);
    const oldValue   = currentRow ? currentRow[field] : undefined;
    history.current  = [...history.current.slice(-30), { type:'update', data:{ rowId, field, oldValue } }];

    let v = value;
    if (['fondiLimit','vleraFituesit'].includes(field)) v = Math.max(0, parseFloat(value) || 0);
    if (['nrOfertave','nrOperatoreve'].includes(field)) v = Math.max(0, parseInt(value)   || 0);
    if (field === 'year')           v = parseInt(value) || 2026;
    if (field === 'vitiShpalljes')  v = parseInt(value) || 2026;
    if (field === 'vitiVleresimit') v = parseInt(value) || 2026;

    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      let u = { ...row, [field]: v, lastEditedAt: new Date().toISOString() };
      if (field === 'vitiShpalljes') u.year = v;
      if (['fondiLimit','vleraFituesit'].includes(field)) u = recalcRow(u);
      return u;
    }));
    setLEC({ rowId, field });

    pendingRef.current += 1;
    try {
      await apiUpdateRow(rowId, field, v);
      const ts = await apiGetUpdate();
      lastUpdateRef.current = ts.lastUpdate;
    } catch {
      await fetchRows(true);
    } finally {
      pendingRef.current -= 1;
    }
  }, [rows, fetchRows]);

  // ── Toggle flag ─────────────────────────────────────────────
  const toggleFlag = useCallback(async (rowId, flag) => {
    const currentRow = rows.find(r => r.id === rowId);
    const oldVal     = currentRow ? currentRow[flag] : false;
    history.current  = [...history.current.slice(-30), { type:'toggle', data:{ rowId, flag, oldVal } }];

    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const on = !row[flag];
      return {
        ...row, [flag]: on,
        ...(flag === 'eAnulluar'   && on ? { ePerfunduar: false } : {}),
        ...(flag === 'ePerfunduar' && on ? { eAnulluar:   false } : {}),
        lastEditedAt: new Date().toISOString(),
      };
    }));
    setLEC({ rowId, field: flag });

    pendingRef.current += 1;
    try {
      await apiToggleFlag(rowId, flag);
      const ts = await apiGetUpdate();
      lastUpdateRef.current = ts.lastUpdate;
    } catch {
      await fetchRows(true);
    } finally {
      pendingRef.current -= 1;
    }
  }, [rows, fetchRows]);

  // ── Add row ─────────────────────────────────────────────────
  const addRow = useCallback(async () => {
    const yr = rows.length > 0 ? (rows[0].year || 2026) : 2026;
    const newRow = {
      id: generateId(), nr: null, year: yr,
      vitiShpalljes: yr, vitiVleresimit: yr,
      description: '', ref: '',
      fondiLimit: 0, vleraFituesit: 0, nePct: 0, kursimi: 0, kursimiPct: 0,
      lloji: 'M', nrOfertave: 1, nrOperatoreve: 1,
      dataShpalljes: '', dataHapjes: '',
      ePerfunduar: false, eAnulluar: false, notes: '',
      lastEditedAt: null, editedBy: null,
    };
    history.current = [...history.current.slice(-30), { type:'add', data:{ rowId: newRow.id } }];
    setRows(prev => [newRow, ...prev]);

    pendingRef.current += 1;
    try {
      await apiAddRow(newRow);
      const ts = await apiGetUpdate();
      lastUpdateRef.current = ts.lastUpdate;
      setRows(prev => {
        const others = prev.filter(r => r.id !== newRow.id);
        const fresh  = prev.find(r => r.id === newRow.id) || newRow;
        return [fresh, ...sortRows(others)];
      });
    } catch {
      await fetchRows(true);
    } finally {
      pendingRef.current -= 1;
    }
  }, [rows, fetchRows]);

  // ── Delete row ───────────────────────────────────────────────
  const deleteRow = useCallback(async (rowId) => {
    // Save the full row for undo restore
    const rowToDelete = rows.find(r => r.id === rowId);
    if (rowToDelete) {
      history.current = [...history.current.slice(-30), { type:'delete', data: rowToDelete }];
    }
    setRows(prev => prev.filter(r => r.id !== rowId));
    setLEC(c => c?.rowId === rowId ? null : c);

    pendingRef.current += 1;
    try {
      await apiDeleteRow(rowId);
      const ts = await apiGetUpdate();
      lastUpdateRef.current = ts.lastUpdate;
    } catch {
      await fetchRows(true);
    } finally {
      pendingRef.current -= 1;
    }
  }, [rows, fetchRows]);

  // ── Import ───────────────────────────────────────────────────
  const replaceRows = useCallback(async (newRows) => {
    history.current = [];  // clear history on import — can't undo a full import
    setRows(sortRows(newRows));
    setLEC(null);

    pendingRef.current += 1;
    try {
      await apiImportRows(newRows);
      const ts = await apiGetUpdate();
      lastUpdateRef.current = ts.lastUpdate;
    } catch {
      await fetchRows(true);
    } finally {
      pendingRef.current -= 1;
    }
  }, [fetchRows]);

  // ── Reset ────────────────────────────────────────────────────
  const doReset = useCallback(async () => {
    history.current = [];
    pendingRef.current += 1;
    try {
      await apiReset();
      await fetchRows(false);
    } catch {
      setError('Reset dështoi.');
    } finally {
      pendingRef.current -= 1;
    }
  }, [fetchRows]);

  return {
    rows, loading, serverError,
    updateCell, toggleFlag, addRow, deleteRow, replaceRows, doReset,
    lastEditedCell, undo, canUndo,
  };
}
