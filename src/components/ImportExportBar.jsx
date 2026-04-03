// components/ImportExportBar.jsx
import { useRef, useState } from 'react';
import { importFromExcel, exportToExcel, COLUMNS } from '../utils/excelIO';

export default function ImportExportBar({ rows, onImport, onAddRow, onReset }) {
  const fileRef = useRef(null);
  const [status,    setStatus]    = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setStatus({ type: 'ok', msg: 'Duke lexuar skedarin…' });
    try {
      const { rows: newRows, errors } = await importFromExcel(file);
      if (newRows.length === 0) {
        setStatus({ type: 'err', msg: 'Nuk u gjetën rreshta të vlefshëm. Kontrollo formatin e skedarit.' });
      } else {
        onImport(newRows);
        setStatus({ type: 'ok', msg: `✓ U importuan ${newRows.length} rreshta me sukses.` });
      }
      if (errors.length > 0) console.warn('Import warnings:', errors);
    } catch (err) {
      setStatus({ type: 'err', msg: 'Gabim gjatë leximit: ' + err.message });
    }
    e.target.value = '';
  }

  function handleExport() {
    exportToExcel(rows, 'OBP_Savings');
    setStatus({ type: 'ok', msg: '✓ Skedari Excel u shkarkua. Mund ta importoni përsëri pa probleme.' });
  }

  function handleReset() {
    if (window.confirm('Jeni i sigurt? Do të rivendosen 207 rreshtat origjinalë.')) {
      onReset();
      setStatus({ type: 'ok', msg: '✓ Të dhënat u rivendosën.' });
    }
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
          <button className="btn btn-export" onClick={handleExport}>
            ⬇ Shkarko Excel
          </button>
          <button className="btn btn-add" onClick={onAddRow}>
            + Shto Rresht
          </button>
          <button className="btn btn-reset" onClick={handleReset} title="Rivendos të dhënat origjinale">
            ↺ Rivendos
          </button>
          <button className="btn btn-guide" onClick={() => setShowGuide(g => !g)}>
            📋 Formati i Excel-it
          </button>
        </div>

        {status && (
          <div className={`iebar-status ${status.type}`}>
            {status.msg}
            <button className="iebar-close" onClick={() => setStatus(null)}>×</button>
          </div>
        )}
      </div>

      {/* ── Format guide panel ── */}
      {showGuide && (
        <div className="format-guide">
          <div className="fg-header">
            <strong>📋 Si duhet të duket skedari Excel për import</strong>
            <button className="fg-close" onClick={() => setShowGuide(false)}>×</button>
          </div>

          <p className="fg-tip">
            💡 <strong>Mënyra më e lehtë:</strong> Klikoni <em>"⬇ Shkarko Excel"</em> — skedari i shkarkuar
            mund të importohet drejtpërdrejt pa asnjë ndryshim.
          </p>

          <p className="fg-tip tip-warn">
            ⚠️ <strong>Rreshti i parë duhet të jetë header (titulli i kolonave).</strong>
            Rreshtat bosh dhe rreshtat "TOTAL" injorohen automatikisht.
          </p>

          <table className="fg-table">
            <thead>
              <tr>
                <th>Kolona në Excel</th>
                <th>Shembull vlere</th>
                <th>Shënime</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Nr.</td><td>1</td><td>Numër rendor (opsional)</td></tr>
              <tr><td>Viti</td><td>2025</td><td>Nxirret automatikisht nga Data Shpalljes</td></tr>
              <tr><td>Objektet</td><td>Blerje automjeti…</td><td>Përshkrimi i procedurës</td></tr>
              <tr><td>Nr. Ref</td><td>REF-68436-11-11-2025</td><td>Numri i referencës</td></tr>
              <tr className="fg-required"><td>Fondi Limit (Leke)</td><td>1991413.9</td><td>⭐ Numër — pa simbole valute</td></tr>
              <tr className="fg-required"><td>Vlera e Fituesit (Leke)</td><td>1665835</td><td>⭐ Numër — llogarit Ne% dhe Kursimin</td></tr>
              <tr><td>Ne % (vlera/fondi)</td><td>83.65</td><td>Auto-llogaritet — nuk duhet ta shkruani</td></tr>
              <tr><td>Kursimi (Leke)</td><td>325578.9</td><td>Auto-llogaritet nga Fondi - Vlera</td></tr>
              <tr><td>Kursimi %</td><td>16.35</td><td>Auto-llogaritet</td></tr>
              <tr><td>Lloji</td><td>M / SH / P</td><td>Lloji i procedurës</td></tr>
              <tr><td>Nr. Ofertave</td><td>3</td><td>Numri i ofertave</td></tr>
              <tr className="fg-required"><td>Data Shpalljes</td><td>11/12/2025</td><td>⭐ Format: MM/DD/YYYY ose YYYY-MM-DD</td></tr>
              <tr><td>Data Hapjes</td><td>11/25/2025</td><td>Format: MM/DD/YYYY ose YYYY-MM-DD</td></tr>
              <tr><td>E Perfunduar (1=po)</td><td>1 ose 0</td><td>1 = e përfunduar, 0 = jo</td></tr>
              <tr><td>E Anulluar (1=po)</td><td>1 ose 0</td><td>1 = e anulluar, 0 = jo</td></tr>
            </tbody>
          </table>

          <p className="fg-tip fg-note">
            ℹ️ Aplikacioni gjithashtu pranon skedarët origjinalë nga sistemi i prokurimit
            me header-at shqip (p.sh. "Fondi limit", "Data e shpalljes", "Nr i ofertave" etj).
          </p>
        </div>
      )}
    </div>
  );
}
