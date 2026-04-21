import SummaryCards    from '../components/SummaryCards';
import BudgetTable     from '../components/BudgetTable';
import ImportExportBar from '../components/ImportExportBar';

export default function TablePage({
  rows, loading, user, isEditor, isAdmin,
  onUpdateCell, onToggleFlag,
  onAddRow, onDeleteRow,
  onImport, onReset,
  onUndo, canUndo,
  lastEditedCell,
}) {
  if (loading) return (
    <main className="page">
      <div className="loading-rows">
        <span className="nav-logo-icon" style={{fontSize:28}}>◈</span>
        <p>Duke ngarkuar të dhënat…</p>
      </div>
    </main>
  );

  return (
    <main className="page">
      <header className="page-hdr">
        <h1 className="page-title">Procedurat e Prokurimit</h1>
        <p className="page-sub">
          {isEditor
            ? <>Klikoni çdo qelizë për të redaktuar · <strong>Tab</strong> = kolona tjetër · <strong>↑↓</strong> = rreshti · Kursimi llogaritet automatikisht</>
            : <>👁️ Modaliteti i shikimit — vetëm lexim. Kontaktoni administratorin për të kërkuar qasje redaktimi.</>
          }
        </p>
      </header>

      <SummaryCards rows={rows} />

      {/* Editors and admins see toolbar; viewers don't */}
      {isEditor && (
        <ImportExportBar
          rows={rows}
          isAdmin={isAdmin}
          isEditor={isEditor}
          onImport={onImport}
          onAddRow={onAddRow}
          onReset={onReset}
          onUndo={onUndo}
          canUndo={canUndo}
        />
      )}

      <BudgetTable
        rows={rows}
        isEditor={isEditor}
        isAdmin={isAdmin}
        onUpdateCell={onUpdateCell}
        onToggleFlag={onToggleFlag}
        onAddRow={onAddRow}
        onDeleteRow={onDeleteRow}
        lastEditedCell={lastEditedCell}
      />
    </main>
  );
}
