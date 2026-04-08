import { grandTotal, formatNum, formatMlnEur, uniqueYears, totalsByYear } from '../utils/calculations';

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
    countByYear[y] = rows.filter(r => r.year === y).length;
    completedByYear[y] = completed.filter(r => r.year === y).length;
    annulledByYear[y] = annulled.filter(r => r.year === y).length;
    annulledFondiByYear[y] = grandTotal(annulled.filter(r => r.year === y), 'fondiLimit');
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
        {years.map(y => (
          <div className="sc-sub" key={y}>{y}: {countByYear[y]}</div>
        ))}
      </div>

      <div className="sc sc-green">
        <div className="sc-label">✓ Të Përfunduara</div>
        <div className="sc-value">{completed.length}</div>
        {years.map(y => (
          <div className="sc-sub" key={y}>{y}: {completedByYear[y]}</div>
        ))}
      </div>

      <div className="sc sc-red">
        <div className="sc-label">✗ Të Anulluara</div>
        <div className="sc-value">{annulled.length}</div>
        <div className="sc-sub">{annulledPct}% e totalit · {formatMlnEur(annulledFondi)} mln €</div>
        {years.map(y => (
          <div className="sc-sub" key={y}>{y}: {annulledByYear[y]} ({formatMlnEur(annulledFondiByYear[y])} mln €)</div>
        ))}
      </div>

      <div className="sc sc-blue">
        <div className="sc-label">Fondi i Prokuruar (gjithsej)</div>
        <div className="sc-value">{formatMlnEur(totalProkuruar)}<span className="sc-unit"> mln €</span></div>
        {years.map(y => (
          <div className="sc-sub" key={y}>{y}: {formatMlnEur(fondiProkByYear[y])} mln €</div>
        ))}
      </div>

      <div className="sc sc-green">
        <div className="sc-label">Fondi i Vlerësuar (✓ përfunduara)</div>
        <div className="sc-value">{formatMlnEur(totalVleresuar)}<span className="sc-unit"> mln €</span></div>
        {vYears.map(y => (
          <div className="sc-sub" key={y}>{y}: {formatMlnEur(fondiVlerByYear[y])} mln €</div>
        ))}
      </div>

      <div className="sc sc-green">
        <div className="sc-label">Kursimi (✓ përfunduara)</div>
        <div className="sc-value">{formatMlnEur(totalKursimi)}<span className="sc-unit"> mln €</span></div>
        <div className="sc-sub">Mesatare: {avgPct.toFixed(2)}%</div>
      </div>
    </div>
  );
}
