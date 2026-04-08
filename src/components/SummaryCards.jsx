import { grandTotal, formatNum, formatMlnEur, uniqueYears } from '../utils/calculations';

export default function SummaryCards({ rows }) {
  const completed = rows.filter(r =>  r.ePerfunduar && !r.eAnulluar);
  const annulled  = rows.filter(r =>  r.eAnulluar);

  const totalProkuruar = grandTotal(rows,      'fondiLimit');
  const totalVleresuar = grandTotal(completed, 'fondiLimit');
  const totalKursimi   = grandTotal(completed, 'kursimi');
  const avgPct         = totalVleresuar > 0 ? (totalKursimi / totalVleresuar * 100) : 0;
  const annulledPct    = rows.length > 0 ? (annulled.length / rows.length * 100).toFixed(1) : '0.0';
  const annulledFondi  = grandTotal(annulled, 'fondiLimit');

  const years = uniqueYears(rows);
  const countByYear = {};
  const completedByYear = {};
  const annulledByYear = {};
  const annulledFondiByYear = {};

  years.forEach(y => {
    countByYear[y] = rows.filter(r => (r.vitiShpalljes || r.year) === y).length;
    completedByYear[y] = completed.filter(r => (r.vitiShpalljes || r.year) === y).length;
    annulledByYear[y] = annulled.filter(r => (r.vitiShpalljes || r.year) === y).length;
    annulledFondiByYear[y] = grandTotal(annulled.filter(r => (r.vitiShpalljes || r.year) === y), 'fondiLimit');
  });

  const fondiProkByYear = {};
  years.forEach(y => {
    fondiProkByYear[y] = grandTotal(rows.filter(r => (r.vitiShpalljes || r.year) === y), 'fondiLimit');
  });

  const fondiVlerByYear = {};
  const vYears = [...new Set(rows.map(r => r.vitiVleresimit || r.year).filter(y => !isNaN(y)))].sort((a,b)=>a-b);
  vYears.forEach(y => {
    fondiVlerByYear[y] = grandTotal(completed.filter(r => (r.vitiVleresimit || r.year) === y), 'fondiLimit');
  });

  return (
    <div className="summary-cards">
      <div className="sc sc-blue">
        <div className="sc-label">Procedura Gjithsej</div>
        <div className="sc-value">{rows.length}</div>
        <div className="sc-years">
          {years.map(y => (
            <div className="sc-year-box" key={y}>
              <span className="sc-year-label">{y}</span>
              <span className="sc-year-value">{countByYear[y]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sc sc-green">
        <div className="sc-label">✓ Të Përfunduara</div>
        <div className="sc-value">{completed.length}</div>
        <div className="sc-years">
          {years.map(y => (
            <div className="sc-year-box" key={y}>
              <span className="sc-year-label">{y}</span>
              <span className="sc-year-value">{completedByYear[y]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sc sc-red">
        <div className="sc-label">✗ Të Anulluara</div>
        <div className="sc-value">{annulled.length}</div>
        <div className="sc-sub">{annulledPct}% e totalit · {formatMlnEur(annulledFondi)} mln €</div>
        <div className="sc-years">
          {years.map(y => (
            <div className="sc-year-box" key={y}>
              <span className="sc-year-label">{y}</span>
              <span className="sc-year-value">{annulledByYear[y]}</span>
              <span className="sc-year-detail">{formatMlnEur(annulledFondiByYear[y])} mln €</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sc sc-blue">
        <div className="sc-label">Fondi i Prokuruar (gjithsej)</div>
        <div className="sc-value">{formatMlnEur(totalProkuruar)}<span className="sc-unit"> mln €</span></div>
        <div className="sc-years">
          {years.map(y => (
            <div className="sc-year-box" key={y}>
              <span className="sc-year-label">{y}</span>
              <span className="sc-year-value">{formatMlnEur(fondiProkByYear[y])} mln €</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sc sc-green">
        <div className="sc-label">Fondi i Vlerësuar (✓ përfunduara)</div>
        <div className="sc-value">{formatMlnEur(totalVleresuar)}<span className="sc-unit"> mln €</span></div>
        <div className="sc-years">
          {vYears.map(y => (
            <div className="sc-year-box" key={y}>
              <span className="sc-year-label">{y}</span>
              <span className="sc-year-value">{formatMlnEur(fondiVlerByYear[y])} mln €</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sc sc-green">
        <div className="sc-label">Kursimi (✓ përfunduara)</div>
        <div className="sc-value">{formatMlnEur(totalKursimi)}<span className="sc-unit"> mln €</span></div>
        <div className="sc-sub">Mesatare: {avgPct.toFixed(2)}%</div>
      </div>
    </div>
  );
}
