import SummaryCards    from '../components/SummaryCards';
import BudgetTable     from '../components/BudgetTable';
import ImportExportBar from '../components/ImportExportBar';

export default function TablePage({
  rows, username,
  onUpdateCell, onToggleFlag,
  onAddRow, onDeleteRow,
  onImport, onReset,
  onUndo, canUndo,
  lastEditedCell,
}) {
  return (
    <main className="page">
      <header className="page-hdr">
        <h1 className="page-title">Procedurat e Prokurimit</h1>
        <p className="page-sub">
          Klikoni çdo qelizë për të redaktuar ·
          <strong> Tab</strong> = kolona tjetër ·
          <strong> ↑↓</strong> = rreshti ·
          <strong> Ne %</strong> = Vlera / Fondi ·
          Kursimi llogaritet automatikisht
        </p>
      </header>

      <SummaryCards rows={rows} />

      {!username && (
        <div className="info-banner">
          ℹ️ Shkruani emrin tuaj lart djathtas — do të regjistrohet kush bëri çdo ndryshim.
        </div>
      )}

      <ImportExportBar
        rows={rows}
        onImport={onImport}
        onAddRow={onAddRow}
        onReset={onReset}
        onUndo={onUndo}
        canUndo={canUndo}
      />

      <BudgetTable
        rows={rows}
        onUpdateCell={onUpdateCell}
        onToggleFlag={onToggleFlag}
        onDeleteRow={onDeleteRow}
        lastEditedCell={lastEditedCell}
      />
    </main>
  );
}
