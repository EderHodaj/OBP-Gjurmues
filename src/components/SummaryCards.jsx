import { grandTotal, formatNum, formatMlnEur, uniqueYears } from '../utils/calculations';

export default function SummaryCards({ rows }) {
  const completed = rows.filter(r =>  r.ePerfunduar && !r.eAnulluar);
  const annulled  = rows.filter(r =>  r.eAnulluar);
  const active    = rows.filter(r => !r.eAnulluar);

  const totalProkuruar = grandTotal(rows,      'fondiLimit');
  const totalVleresuar = grandTotal(completed, 'fondiLimit');
  const totalKursimi   = grandTotal(completed, 'kursimi');
  const avgPct         = totalVleresuar > 0 ? (totalKursimi / totalVleresuar * 100) : 0;
  const annulledPct    = rows.length > 0 ? (annulled.length / rows.length * 100).toFixed(1) : '0.0';
  const years          = uniqueYears(rows);

  return (
    <div className="summary-cards">
      <div className="sc sc-blue">
        <div className="sc-label">Procedura Gjithsej</div>
        <div className="sc-value">{rows.length}</div>
        <div className="sc-sub">{years.join(' · ')}</div>
      </div>

      <div className="sc sc-green">
        <div className="sc-label">✓ Të Përfunduara</div>
        <div className="sc-value">{completed.length}</div>
        <div className="sc-sub">{rows.length > 0 ? ((completed.length/rows.length)*100).toFixed(1) : 0}% e totalit</div>
      </div>

      <div className="sc sc-red">
        <div className="sc-label">✗ Të Anulluara</div>
        <div className="sc-value">{annulled.length}</div>
        <div className="sc-sub">{annulledPct}% e totalit</div>
      </div>

      <div className="sc sc-blue">
        <div className="sc-label">Fondi i Prokuruar (të gjitha)</div>
        <div className="sc-value">{formatMlnEur(totalProkuruar)}<span className="sc-unit"> mln €</span></div>
        <div className="sc-sub">{formatNum(totalProkuruar)} Lekë</div>
      </div>

      <div className="sc sc-green">
        <div className="sc-label">Fondi i Vlerësuar (✓ përfunduara)</div>
        <div className="sc-value">{formatMlnEur(totalVleresuar)}<span className="sc-unit"> mln €</span></div>
        <div className="sc-sub">{formatNum(totalVleresuar)} Lekë</div>
      </div>

      <div className="sc sc-green">
        <div className="sc-label">Kursimi (✓ përfunduara)</div>
        <div className="sc-value">{formatMlnEur(totalKursimi)}<span className="sc-unit"> mln €</span></div>
        <div className="sc-sub">Mesatare: {avgPct.toFixed(2)}%</div>
      </div>
    </div>
  );
}
