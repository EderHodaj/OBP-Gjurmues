import { useState, useMemo, useEffect, useRef } from 'react';
import EditableCell from './EditableCell';
import { formatNum, formatTimestamp, totalsByYear, uniqueYears } from '../utils/calculations';

const PAGE_SIZE = 50;

export default function BudgetTable({ rows, onUpdateCell, onToggleFlag, onDeleteRow, lastEditedCell }) {
  const [search,       setSearch]       = useState('');
  const [filterYear,   setFilterYear]   = useState('all');
  const [filterLloji,  setFilterLloji]  = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page,         setPage]         = useState(1);
  const [sortField,    setSortField]    = useState(null);
  const [sortDir,      setSortDir]      = useState('asc');

  const tableScrollRef = useRef(null);
  const topMirrorRef   = useRef(null);
  const topInnerRef    = useRef(null);

  useEffect(() => {
    function syncWidth() {
      if (tableScrollRef.current && topInnerRef.current) {
        topInnerRef.current.style.width = tableScrollRef.current.scrollWidth + 'px';
      }
    }
    syncWidth();
    const ro = new ResizeObserver(syncWidth);
    if (tableScrollRef.current) ro.observe(tableScrollRef.current);
    return () => ro.disconnect();
  }, [rows, page]);

  function onTableScroll(e) {
    if (topMirrorRef.current) topMirrorRef.current.scrollLeft = e.target.scrollLeft;
  }
  function onMirrorScroll(e) {
    if (tableScrollRef.current) tableScrollRef.current.scrollLeft = e.target.scrollLeft;
  }

  const years  = uniqueYears(rows);
  const llojet = [...new Set(rows.map(r => r.lloji).filter(Boolean))].sort();

  const filtered = useMemo(() => {
    let r = rows;
    if (filterYear   !== 'all') r = r.filter(x => String(x.vitiShpalljes || x.year) === filterYear || String(x.vitiVleresimit || x.year) === filterYear);
    if (filterLloji  !== 'all') r = r.filter(x => x.lloji === filterLloji);
    if (filterStatus === 'completed') r = r.filter(x =>  x.ePerfunduar && !x.eAnulluar);
    if (filterStatus === 'annulled')  r = r.filter(x =>  x.eAnulluar);
    if (filterStatus === 'active')    r = r.filter(x => !x.ePerfunduar && !x.eAnulluar);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x => (x.description||'').toLowerCase().includes(q) || (x.ref||'').toLowerCase().includes(q));
    }
    if (sortField) {
      r = [...r].sort((a, b) => {
        const av = a[sortField], bv = b[sortField];
        const cmp = typeof av === 'number' ? av - bv : String(av||'').localeCompare(String(bv||''));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return r;
  }, [rows, search, filterYear, filterLloji, filterStatus, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  function toggleSort(f) {
    if (sortField === f) setSortDir(d => d==='asc'?'desc':'asc');
    else { setSortField(f); setSortDir('asc'); }
  }

  function Th({ field, children, style }) {
    const active = sortField === field;
    return (
      <th className={`sortable${active?' sorted':''}`} onClick={() => toggleSort(field)} style={style}>
        {children} <span className="sort-icon">{active ? (sortDir==='asc'?'↑':'↓') : '↕'}</span>
      </th>
    );
  }

  // Footer totals
  const completedRows = rows.filter(r => r.ePerfunduar && !r.eAnulluar);
  const kursimiByYear = totalsByYear(completedRows, 'kursimi');
  const fondiByYear   = totalsByYear(completedRows, 'fondiLimit');

  return (
    <div className="table-wrapper">
      <div className="table-filters">
        <input className="filter-input" placeholder="🔍  Kërko sipas objektit ose ref…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className="filter-select" value={filterYear}
          onChange={e => { setFilterYear(e.target.value); setPage(1); }}>
          <option value="all">Të gjitha vitet</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="filter-select" value={filterLloji}
          onChange={e => { setFilterLloji(e.target.value); setPage(1); }}>
          <option value="all">Të gjitha llojet</option>
          {llojet.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="filter-select" value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="all">Të gjitha statuset</option>
          <option value="active">Në proces</option>
          <option value="completed">✓ Të përfunduara</option>
          <option value="annulled">✗ Të anulluara</option>
        </select>
        <span className="filter-count">{filtered.length} rreshta</span>
      </div>

      <div className="scroll-top-mirror" ref={topMirrorRef} onScroll={onMirrorScroll}>
        <div className="scroll-top-inner" ref={topInnerRef} />
      </div>

      <div className="table-scroll" ref={tableScrollRef} onScroll={onTableScroll}>
        <table className="btable">
          <thead>
            <tr>
              <Th field="nr">Nr.</Th>
              <th style={{ minWidth:300 }}>Objektet</th>
              <th>Nr. Ref</th>
              <Th field="fondiLimit">Fondi Limit</Th>
              <Th field="vleraFituesit">Vlera Fituesit</Th>
              <Th field="nePct" style={{ minWidth:90 }}>Ne %</Th>
              <Th field="kursimi">Kursimi (Lekë)</Th>
              <Th field="kursimiPct">Kursimi %</Th>
              <th>Lloji</th>
              <Th field="nrOfertave">Oferta</Th>
              <Th field="dataShpalljes" style={{ minWidth:110 }}>Dt. Shpalljes</Th>
              <Th field="dataHapjes"   style={{ minWidth:110 }}>Dt. Hapjes</Th>
              <Th field="vitiShpalljes" style={{ minWidth:90 }}>Viti Shpalljes</Th>
              <Th field="vitiVleresimit" style={{ minWidth:90 }}>Viti Vlerësimit</Th>
              <th className="col-flag" title="E Përfunduar">✓</th>
              <th className="col-flag" title="E Anulluar">✗</th>
              <th className="col-meta">Redaktuar nga</th>
              <th className="col-meta">Redaktuar më</th>
              <th className="col-del">⊗</th>
            </tr>
          </thead>

          <tbody>
            {pageRows.length === 0 && (
              <tr><td colSpan={19} className="empty-row">Nuk ka rreshta.</td></tr>
            )}
            {pageRows.map(row => {
              const hi  = lastEditedCell?.rowId === row.id;
              const neg = Number(row.kursimi) < 0;
              const rowCls = row.eAnulluar ? 'row-annulled' : row.ePerfunduar ? 'row-completed' : hi ? 'row-hi' : '';

              return (
                <tr key={row.id} className={rowCls}>
                  <EditableCell value={row.nr??''} field="nr" rowId={row.id} onSave={onUpdateCell}
                    isHighlighted={hi && lastEditedCell?.field==='nr'} />
                  <EditableCell value={row.description} field="description" rowId={row.id} onSave={onUpdateCell}
                    isHighlighted={hi && lastEditedCell?.field==='description'} />
                  <EditableCell value={row.ref} field="ref" rowId={row.id} onSave={onUpdateCell}
                    isHighlighted={hi && lastEditedCell?.field==='ref'} />
                  <EditableCell value={row.fondiLimit} field="fondiLimit" rowId={row.id} onSave={onUpdateCell}
                    isHighlighted={hi && lastEditedCell?.field==='fondiLimit'}
                    display={formatNum(row.fondiLimit)} />
                  <EditableCell value={row.vleraFituesit} field="vleraFituesit" rowId={row.id} onSave={onUpdateCell}
                    isHighlighted={hi && lastEditedCell?.field==='vleraFituesit'}
                    display={formatNum(row.vleraFituesit)} />

                  <td className="ne-pct-cell">
                    <div className="ne-pct-wrap">
                      <span style={{ color: Number(row.nePct) > 100 ? 'var(--danger)' : 'var(--text)' }}>
                        {Number(row.nePct||0).toFixed(2)}%
                      </span>
                      <div className="pct-bar-track">
                        <div className="pct-bar-fill" style={{
                          width: `${Math.min(100, Math.abs(row.nePct||0))}%`,
                          background: Number(row.nePct) > 100 ? 'var(--danger)' : 'var(--accent)'
                        }} />
                      </div>
                    </div>
                  </td>

                  <td className={`kursimi-cell ${neg?'negative':'positive'}`}>
                    {formatNum(row.kursimi)}
                  </td>
                  <td className="ne-pct-cell">
                    <div className="ne-pct-wrap">
                      <span className={neg?'negative':'positive'}>
                        {Number(row.kursimiPct||0).toFixed(2)}%
                      </span>
                      <div className="pct-bar-track">
                        <div className="pct-bar-fill" style={{
                          width: `${Math.min(100,Math.abs(row.kursimiPct||0))}%`,
                          background: neg ? 'var(--danger)' : 'var(--accent2)'
                        }} />
                      </div>
                    </div>
                  </td>

                  <EditableCell value={row.lloji} field="lloji" rowId={row.id} onSave={onUpdateCell}
                    isHighlighted={hi && lastEditedCell?.field==='lloji'} />
                  <EditableCell value={row.nrOfertave} field="nrOfertave" rowId={row.id} onSave={onUpdateCell}
                    isHighlighted={hi && lastEditedCell?.field==='nrOfertave'} />
                  <EditableCell value={row.dataShpalljes} field="dataShpalljes" rowId={row.id} onSave={onUpdateCell}
                    isHighlighted={hi && lastEditedCell?.field==='dataShpalljes'} />
                  <EditableCell value={row.dataHapjes} field="dataHapjes" rowId={row.id} onSave={onUpdateCell}
                    isHighlighted={hi && lastEditedCell?.field==='dataHapjes'} />

                  {/* Viti Shpalljes */}
                  <EditableCell value={row.vitiShpalljes || row.year} field="vitiShpalljes" rowId={row.id} onSave={onUpdateCell}
                    isHighlighted={hi && lastEditedCell?.field==='vitiShpalljes'} />

                  {/* Viti Vlerësimit */}
                  <EditableCell value={row.vitiVleresimit || row.year} field="vitiVleresimit" rowId={row.id} onSave={onUpdateCell}
                    isHighlighted={hi && lastEditedCell?.field==='vitiVleresimit'} />

                  <td className="col-flag">
                    <input type="checkbox" className="flag-check check-green"
                      checked={!!row.ePerfunduar}
                      onChange={() => onToggleFlag(row.id, 'ePerfunduar')}
                      title="Shëno si të përfunduar" />
                  </td>

                  <td className="col-flag">
                    <input type="checkbox" className="flag-check check-red"
                      checked={!!row.eAnulluar}
                      onChange={() => onToggleFlag(row.id, 'eAnulluar')}
                      title="Shëno si të anulluar" />
                  </td>

                  <td className="col-meta meta-txt">{row.editedBy||'—'}</td>
                  <td className="col-meta meta-txt">{formatTimestamp(row.lastEditedAt)}</td>
                  <td className="col-del">
                    <button className="btn-del" onClick={() => onDeleteRow(row.id)} title="Fshi rreshtin">×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {uniqueYears(rows).map(y => {
            const kurs = kursimiByYear[y] || 0;
            const fond = fondiByYear[y]   || 0;
            return (
              <tfoot key={y}>
                <tr className="total-row">
                  <td colSpan={6} className="total-lbl">✓ Kursimi {y} (vetëm të përfunduarat)</td>
                  <td className="total-val">{formatNum(kurs)}</td>
                  <td className="total-val">{fond > 0 ? (kurs/fond*100).toFixed(2)+'%' : '—'}</td>
                  <td colSpan={11} />
                </tr>
              </tfoot>
            );
          })}
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="pg-btn" disabled={page===1}          onClick={()=>setPage(1)}>⟪ E para</button>
          <button className="pg-btn" disabled={page===1}          onClick={()=>setPage(p=>p-1)}>← Para</button>
          <span className="pg-info">Faqja {page} / {totalPages} &nbsp;·&nbsp; {filtered.length} rreshta</span>
          <button className="pg-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Pas →</button>
          <button className="pg-btn" disabled={page===totalPages} onClick={()=>setPage(totalPages)}>E fundit ⟫</button>
        </div>
      )}
    </div>
  );
}
