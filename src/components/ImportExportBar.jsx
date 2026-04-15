// ImportExportBar — includes Undo button and PDF export
import { useRef, useState } from 'react';
import { importFromExcel, exportToExcel } from '../utils/excelIO';

export default function ImportExportBar({ rows, onImport, onAddRow, onReset, onUndo, canUndo }) {
  const fileRef = useRef(null);
  const [status, setStatus] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files[0]; if (!file) return;
    setStatus({ type:'ok', msg:'Duke lexuar skedarin…' });
    try {
      const { rows: newRows, errors } = await importFromExcel(file);
      if (newRows.length === 0) setStatus({ type:'err', msg:'Nuk u gjetën rreshta të vlefshëm.' });
      else { onImport(newRows); setStatus({ type:'ok', msg:`✓ U importuan ${newRows.length} rreshta me sukses.` }); }
      if (errors.length > 0) console.warn('Import warnings:', errors);
    } catch (err) { setStatus({ type:'err', msg:'Gabim: ' + err.message }); }
    e.target.value = '';
  }

  function handlePrint() {
    // Open dashboard in print mode — browser handles "Save as PDF"
    window.print();
  }

  return (
    <div className="iebar-wrap">
      <div className="iebar">
        <div className="iebar-left">
          <input ref={fileRef} type="file" accept=".xlsx,.xls"
            onChange={handleFileChange} style={{ display:'none' }} />

          <button className="btn btn-import" onClick={() => fileRef.current.click()}>
            ⬆ Importo Excel
          </button>
          <button className="btn btn-export"
            onClick={() => { exportToExcel(rows, 'OBP_Savings'); setStatus({ type:'ok', msg:'✓ Shkarkuar.' }); }}>
            ⬇ Shkarko Excel
          </button>
          <button className="btn btn-add" onClick={onAddRow}>
            + Shto Rresht
          </button>

          {/* Undo button — feature #4 */}
          <button
            className="btn btn-undo"
            onClick={onUndo}
            disabled={!canUndo}
            title="Kthe ndryshimin e fundit (Ctrl+Z)"
          >
            ↩ Undo
          </button>

          <button className="btn btn-reset"
            onClick={() => { if (window.confirm('Rivendos?')) { onReset(); setStatus({ type:'ok', msg:'✓ Rivendosur.' }); } }}>
            ↺ Rivendos
          </button>
        </div>

        {status && (
          <div className={`iebar-status ${status.type}`}>
            {status.msg}
            <button className="iebar-close" onClick={() => setStatus(null)}>×</button>
          </div>
        )}
      </div>
    </div>
  );
}
