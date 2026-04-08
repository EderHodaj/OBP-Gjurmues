import { useState, useEffect, useCallback } from 'react';
import { loadRows, saveRows, loadUsername, saveUsername, createBlankRow, resetToSeed } from '../utils/storage';
import { recalcRow } from '../utils/calculations';

export function useBudget() {
  const [rows, setRows]           = useState(() => loadRows());
  const [username, setUsername]   = useState(() => loadUsername());
  const [lastEditedCell, setLEC]  = useState(null);

  useEffect(() => { saveRows(rows); },       [rows]);
  useEffect(() => { saveUsername(username); }, [username]);

  const updateCell = useCallback((rowId, field, value) => {
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      let v = value;
      if (['fondiLimit','vleraFituesit'].includes(field)) v = Math.max(0, parseFloat(value) || 0);
      if (field === 'nrOfertave') v = Math.max(0, parseInt(value) || 0);
      if (field === 'year')            v = parseInt(value) || row.year;
      if (field === 'vitiShpalljes')   v = parseInt(value) || row.vitiShpalljes;
      if (field === 'vitiVleresimit')  v = parseInt(value) || row.vitiVleresimit;
      let updated = { ...row, [field]: v, lastEditedAt: new Date().toISOString(), editedBy: username || 'Anonymous' };
      if (['fondiLimit','vleraFituesit'].includes(field)) updated = recalcRow(updated);
      return updated;
    }));
    setLEC({ rowId, field });
  }, [username]);

  const toggleFlag = useCallback((rowId, flag) => {
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const on  = !row[flag];
      const extra = {};
      if (flag === 'eAnulluar'   && on) extra.ePerfunduar = false;
      if (flag === 'ePerfunduar' && on) extra.eAnulluar   = false;
      return { ...row, [flag]: on, ...extra, lastEditedAt: new Date().toISOString(), editedBy: username || 'Anonymous' };
    }));
    setLEC({ rowId, field: flag });
  }, [username]);

  const addRow      = useCallback(() => {
    const yr = rows.length > 0 ? rows[0].year : 2026;
    setRows(prev => [createBlankRow(yr), ...prev]);
  }, [rows]);

  const deleteRow   = useCallback((rowId) => {
    setRows(prev => prev.filter(r => r.id !== rowId));
    setLEC(c => c?.rowId === rowId ? null : c);
  }, []);

  const replaceRows = useCallback((nr) => { setRows(nr); setLEC(null); }, []);
  const doReset     = useCallback(() => { setRows(resetToSeed()); setLEC(null); }, []);

  return { rows, username, setUsername, updateCell, toggleFlag, addRow, deleteRow, replaceRows, doReset, lastEditedCell };
}
