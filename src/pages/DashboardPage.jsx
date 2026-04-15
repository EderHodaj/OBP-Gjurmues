import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList,
} from 'recharts';
import { formatNum, formatMlnEur, grandTotal, totalsByYear, uniqueYears } from '../utils/calculations';

// Historical data
// NOTE: annulled/annulledPct are now by vitiVleresimit (change #1)
const HISTORY = [
  { label:'2019',        procedures:158, annulled:51,  completed:107, fondiMlnEur:85,  fondiVlerMlnEur:85,  kursimiMlnEur:3.3,  ofertave:3.7, operatoreve:3.7, procPerMonth:13.2, fondiPerMonth:7.08, annulledPct:32.28, suksesPct:67.72, kursimiVlerPct:3.88,  avgKursimiPct:11 },
  { label:'2020',        procedures:267, annulled:86,  completed:181, fondiMlnEur:47,  fondiVlerMlnEur:47,  kursimiMlnEur:5.1,  ofertave:3.8, operatoreve:3.8, procPerMonth:22.3, fondiPerMonth:3.92, annulledPct:32.21, suksesPct:67.79, kursimiVlerPct:10.85, avgKursimiPct:20 },
  { label:'2021',        procedures:187, annulled:64,  completed:123, fondiMlnEur:37,  fondiVlerMlnEur:37,  kursimiMlnEur:4.6,  ofertave:3.6, operatoreve:3.6, procPerMonth:15.6, fondiPerMonth:3.08, annulledPct:34.22, suksesPct:65.78, kursimiVlerPct:12.43, avgKursimiPct:22 },
  { label:'2022',        procedures:204, annulled:67,  completed:137, fondiMlnEur:58,  fondiVlerMlnEur:58,  kursimiMlnEur:4.6,  ofertave:3.3, operatoreve:3.3, procPerMonth:17.0, fondiPerMonth:4.83, annulledPct:32.84, suksesPct:67.16, kursimiVlerPct:7.93,  avgKursimiPct:17 },
  { label:'2023',        procedures:171, annulled:74,  completed:97,  fondiMlnEur:39,  fondiVlerMlnEur:39,  kursimiMlnEur:2.7,  ofertave:2.7, operatoreve:2.7, procPerMonth:14.3, fondiPerMonth:3.25, annulledPct:43.27, suksesPct:56.73, kursimiVlerPct:6.92,  avgKursimiPct:16 },
  { label:'OBP 8M 2024', procedures:314, annulled:55,  completed:259, fondiMlnEur:168, fondiVlerMlnEur:168, kursimiMlnEur:18.4, ofertave:4.7, operatoreve:4.7, procPerMonth:34.9, fondiPerMonth:21.0, annulledPct:16.88, suksesPct:83.12, kursimiVlerPct:10.95, avgKursimiPct:17 },
];
// Years in HISTORY are fixed/read-only — live data from the app starts from 2025+
const HISTORY_YEARS = new Set(HISTORY.map(h => h.label));

const OBP_CLR  = '#3b82f6';
const HIST_CLR = null; // Each chart uses its own color for historical bars too
const GREEN    = '#10b981';
const AMBER    = '#f59e0b';
const RED      = '#ef4444';
const PURPLE   = '#8b5cf6';
const CYAN     = '#06b6d4';
const TT       = { background:'#1c2334', border:'1px solid #3b82f6', borderRadius:8, color:'#ffffff', fontFamily:'DM Mono,monospace', fontSize:13, boxShadow:'0 4px 16px rgba(0,0,0,.5)' };
const TT_L     = { color:'#c8f0a0', fontWeight:'bold' };
const TT_ITEM  = { color:'#ffffff' };

export default function DashboardPage({ rows }) {
  if (rows.length === 0) return (
    <main className="page"><div className="info-banner">Nuk ka të dhëna — shtoni rreshta në faqen Tabela.</div></main>
  );

  const completed = rows.filter(r =>  r.ePerfunduar && !r.eAnulluar);
  const annulled  = rows.filter(r =>  r.eAnulluar);
  const active    = rows.filter(r => !r.ePerfunduar && !r.eAnulluar);
  const years     = uniqueYears(rows);

  // Grand totals
  const grandFondiAll  = grandTotal(rows,      'fondiLimit');
  const grandFondiComp = grandTotal(completed, 'fondiLimit');
  const grandKursimi   = grandTotal(completed, 'kursimi');
  const avgPct         = grandFondiComp > 0 ? (grandKursimi / grandFondiComp * 100) : 0;
  const annulledPct    = rows.length > 0 ? (annulled.length / rows.length * 100).toFixed(1) : '0.0';
  const annulledFondi  = grandTotal(annulled, 'fondiLimit');

  // Proclamation-based (vitiShpalljes): procedures count, fondi prokuruar
  const countByYear = {}, fondiProkByYear = {};
  years.forEach(y => {
    const yShp = rows.filter(r => (r.vitiShpalljes || r.year) === y);
    countByYear[y]     = yShp.length;
    fondiProkByYear[y] = grandTotal(yShp, 'fondiLimit');
  });

  // Evaluation-based (vitiVleresimit): completed, annulled (#1 CHANGED), kursimi, fondi vlerësuar
  const completedByYear = {}, fondiVlerByYear = {}, annulledByYear = {}, annulledFondiByYear = {};
  const totKurs      = totalsByYear(completed, 'kursimi',    'vitiVleresimit');
  const totFondiVler = totalsByYear(completed, 'fondiLimit', 'vitiVleresimit');
  years.forEach(y => {
    const yComp = completed.filter(r => (r.vitiVleresimit || r.year) === y);
    // CHANGE #1: annulled now by vitiVleresimit
    const yAnn  = annulled.filter(r => (r.vitiVleresimit || r.year) === y);
    completedByYear[y]    = yComp.length;
    fondiVlerByYear[y]    = grandTotal(yComp, 'fondiLimit');
    annulledByYear[y]     = yAnn.length;
    annulledFondiByYear[y]= grandTotal(yAnn, 'fondiLimit');
  });

  // ── Build live chart data per year ────────────────────────
  // Skip years already in HISTORY — those are fixed/read-only
  // Exclude HISTORY years AND bare year 2024 (shown as 'OBP 8M 2024' in history)
  const liveByYear = years.filter(y => !HISTORY_YEARS.has(String(y)) && String(y) !== '2024').map(y => {
    // Proclaimed this year (vitiShpalljes)
    const yShp   = rows.filter(r => (r.vitiShpalljes  || r.year) === y);
    const fondiP = fondiProkByYear[y] || 0;

    // Evaluated this year (vitiVleresimit) — CHANGE #1: annulled also by vitiVleresimit
    const yComp  = completed.filter(r => (r.vitiVleresimit || r.year) === y);
    const yAnn   = annulled.filter(r => (r.vitiVleresimit  || r.year) === y);
    const kurs   = totKurs[y] || 0;
    const fondiV = totFondiVler[y] || 0;

    // ofertave & operatoreve: only completed
    const avgOf = yComp.length > 0 ? yComp.reduce((s,r) => s+Number(r.nrOfertave    ||0),0)/yComp.length : 0;
    const avgOe = yComp.length > 0 ? yComp.reduce((s,r) => s+Number(r.nrOperatoreve ||0),0)/yComp.length : 0;

    // sukses = total proclaimed - annulled (by vitiVleresimit per CHANGE #1)
    // We use yShp as the "total" base and yAnn (vlerësimit) as annulled
    const sukses    = yShp.length - yAnn.length;
    const suksesPct = yShp.length > 0 ? (sukses / yShp.length * 100) : 0;
    // CHANGE #1: annulledPct now uses vitiVleresimit annulled / total proclaimed
    const annPct    = yShp.length > 0 ? (yAnn.length / yShp.length * 100) : 0;

    // CHANGE #4: kursimiVlerPct = kursimi / fondi VLERËSUAR (not prokuruar)
    const kursimiVlerPct = fondiV > 0 ? (kurs / fondiV * 100) : 0;

    const avgKursimiPct = yComp.length > 0
      ? yComp.reduce((s,r) => s+(Number(r.kursimiPct)||0),0)/yComp.length : 0;

    // CHANGE #2: procPerMonth and fondiPerMonth = value / months up to last proclamation month in that year
    // Find the last month with a proclamation in this year
    const monthsSet = new Set();
    yShp.forEach(r => {
      if (r.dataShpalljes) {
        const p = r.dataShpalljes.split('/');
        if (p.length === 3) monthsSet.add(Number(p[0])); // collect month numbers
      }
    });
    // nMonths = the highest month number seen (e.g. if last proc is in Nov → 11 months)
    const nMonths    = monthsSet.size > 0 ? Math.max(...monthsSet) : 12;
    const procPerMonth  = parseFloat((yShp.length / nMonths).toFixed(1));
    const fondiPerMonth = parseFloat((fondiP / nMonths / 100_000_000).toFixed(2));

    // CHANGE #3: fondi vlerësuar in mln € for new chart
    const fondiVlerMlnEur = parseFloat(formatMlnEur(fondiV));

    return {
      label: String(y), isObp: true,
      procedures:      yShp.length,
      annulled:        yAnn.length,       // now by vitiVleresimit
      completed:       yComp.length,
      fondiMlnEur:     parseFloat(formatMlnEur(fondiP)),
      fondiVlerMlnEur, // CHANGE #3
      kursimiMlnEur:   parseFloat(formatMlnEur(kurs)),
      ofertave:        parseFloat(avgOf.toFixed(1)),
      operatoreve:     parseFloat(avgOe.toFixed(1)),
      sukses,
      suksesPct:       parseFloat(suksesPct.toFixed(1)),
      annulledPct:     parseFloat(annPct.toFixed(1)),  // CHANGE #1
      kursimiVlerPct:  parseFloat(kursimiVlerPct.toFixed(2)), // CHANGE #4
      avgKursimiPct:   parseFloat(avgKursimiPct.toFixed(2)),
      procPerMonth,    // CHANGE #2
      fondiPerMonth,   // CHANGE #2
    };
  });

  function merged(field) {
    return [
      ...HISTORY.map(h => ({
        label: h.label,
        value: field === 'sukses' ? (h.procedures - h.annulled) : (h[field] ?? 0),
        isObp: false,
      })),
      ...liveByYear.map(l => ({ label: l.label, value: l[field] ?? 0, isObp: true })),
    ];
  }

  // Dual bar: total vs annulled (CHANGE #1: annulled by vitiVleresimit in live data)
  function mergedDual() {
    return [
      ...HISTORY.map(h => ({ label:h.label, total:h.procedures, annulled:h.annulled, isObp:false })),
      ...liveByYear.map(l => ({ label:l.label, total:l.procedures, annulled:l.annulled, isObp:true })),
    ];
  }

  const statusPie = [
    { name:'Në proces',      value: active.length    },
    { name:'Të përfunduara', value: completed.length },
    { name:'Të anulluara',   value: annulled.length  },
  ].filter(d => d.value > 0);
  const statusColors = [AMBER, GREEN, RED];

  return (
    <main className="page">
      <header className="page-hdr">
        <h1 className="page-title">Procedurat e Prokurimit — OBP</h1>
        <p className="page-sub">
          Krahasim historik · {rows.length} procedura ·
          Prokurimi sipas <strong>vitit shpalljes</strong> · Vlerësimi sipas <strong>vitit vlerësimit</strong>
        </p>
        {/* PDF export button — feature #1 */}
        <button
          className="btn btn-pdf no-print"
          onClick={() => window.print()}
          style={{ marginTop: 12 }}
          title="Shtyp ose Ruaj si PDF"
        >
          🖨️ Shtyp / Ruaj si PDF
        </button>
      </header>

      {/* ── KPI Cards ── */}
      <div className="dash-kpis">
        <div className="kpi kpi-blue">
          <div className="kpi-label">Procedura Gjithsej (viti shpalljes)</div>
          <div className="kpi-value">{rows.length}</div>
          <div className="sc-years">{years.map(y => <div className="sc-year-box" key={y}><span className="sc-year-label">{y}</span><span className="sc-year-value">{countByYear[y]}</span></div>)}</div>
        </div>
        <div className="kpi kpi-green">
          <div className="kpi-label">✓ Të Përfunduara (viti vlerësimit)</div>
          <div className="kpi-value">{completed.length}</div>
          <div className="kpi-sub">{rows.length>0?(completed.length/rows.length*100).toFixed(1):0}% e totalit</div>
          <div className="sc-years">{years.map(y => <div className="sc-year-box" key={y}><span className="sc-year-label">{y}</span><span className="sc-year-value">{completedByYear[y]}</span></div>)}</div>
        </div>
        {/* CHANGE #1: label updated to viti vlerësimit */}
        <div className="kpi kpi-red">
          <div className="kpi-label">✗ Të Anulluara (viti vlerësimit)</div>
          <div className="kpi-value">{annulled.length}</div>
          <div className="kpi-sub">{annulledPct}% · {formatMlnEur(annulledFondi)} mln €</div>
          <div className="sc-years">{years.map(y => <div className="sc-year-box" key={y}><span className="sc-year-label">{y}</span><span className="sc-year-value">{annulledByYear[y]}</span><span className="sc-year-detail">{formatMlnEur(annulledFondiByYear[y])} mln €</span></div>)}</div>
        </div>
        <div className="kpi kpi-blue">
          <div className="kpi-label">Fondi i Prokuruar — gjithsej (viti shpalljes)</div>
          <div className="kpi-value">{formatMlnEur(grandFondiAll)} mln €</div>
          <div className="kpi-sub">{formatNum(grandFondiAll)} Lekë</div>
          <div className="sc-years">{years.map(y => <div className="sc-year-box" key={y}><span className="sc-year-label">{y}</span><span className="sc-year-value">{formatMlnEur(fondiProkByYear[y])} mln €</span></div>)}</div>
        </div>
        <div className="kpi kpi-green">
          <div className="kpi-label">Fondi i Vlerësuar ✓ (viti vlerësimit)</div>
          <div className="kpi-value">{formatMlnEur(grandFondiComp)} mln €</div>
          <div className="kpi-sub">{formatNum(grandFondiComp)} Lekë</div>
          <div className="sc-years">{years.map(y => <div className="sc-year-box" key={y}><span className="sc-year-label">{y}</span><span className="sc-year-value">{formatMlnEur(fondiVlerByYear[y])} mln €</span></div>)}</div>
        </div>
        <div className="kpi kpi-green">
          <div className="kpi-label">Kursimi Total ✓ (viti vlerësimit)</div>
          <div className="kpi-value">{formatMlnEur(grandKursimi)} mln €</div>
          <div className="kpi-sub">Mesatare: {avgPct.toFixed(2)}%</div>
          <div className="sc-years">{years.map(y => <div className="sc-year-box" key={y}><span className="sc-year-label">{y}</span><span className="sc-year-value">{formatMlnEur(totKurs[y]||0)} mln €</span></div>)}</div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="dash-grid">

        {/* 1 */}
        <ChartCard title="Numri i Procedurave (viti shpalljes)">
          <BarC data={merged('procedures')} fmt={v=>`${v}`} label="Procedura" /><Legend2 />
        </ChartCard>

        {/* 2 */}
        <ChartCard title="Fonde të Prokuruara (mln €) — viti shpalljes">
          <BarC data={merged('fondiMlnEur')} fmt={v=>`${v} mln €`} label="Fondi" /><Legend2 />
        </ChartCard>

        {/* 3 */}
        <ChartCard title="Kursimet (mln €) — vetëm ✓ të përfunduarat" accent>
          <BarC data={merged('kursimiMlnEur')} fmt={v=>`${v} mln €`} label="Kursimi" green /><Legend2 green />
        </ChartCard>

        {/* 4 */}
        <ChartCard title="Numri Mesatar i Ofertave — vetëm ✓ të përfunduarat">
          <BarC data={merged('ofertave')} fmt={v=>`${v}`} label="Oferta" amber domain={[0,8]} /><Legend2 amber />
        </ChartCard>

        {/* 5 */}
        <ChartCard title="Numri Mesatar i Operatorëve Ekonomikë — vetëm ✓ të përfunduarat">
          <BarC data={merged('operatoreve')} fmt={v=>`${v}`} label="OE" color={PURPLE} /><Legend2 color={PURPLE} />
        </ChartCard>

        {/* 6 */}
        <ChartCard title="Procedura të Suksesshme (Nr.) = Gjithsej − Anullime">
          <BarC data={merged('sukses')} fmt={v=>`${v}`} label="Sukses" green /><Legend2 green />
        </ChartCard>

        {/* 7 */}
        <ChartCard title="Procedura të Suksesshme (%) = (Gjithsej − Anullime) / Gjithsej">
          <BarC data={merged('suksesPct')} fmt={v=>`${v}%`} label="Sukses %" green /><Legend2 green />
        </ChartCard>

        {/* 8 — dual bar */}
        <ChartCard title="Procedura Gjithsej vs Anullime (viti vlerësimit)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mergedDual()} margin={{ top:10, right:10, left:0, bottom:40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#253047" />
              <XAxis dataKey="label" stroke="#7a8ba8" tick={{ fontSize:11, fontFamily:'DM Mono', fill:'#7a8ba8' }} angle={-35} textAnchor="end" interval={0} />
              <YAxis stroke="#7a8ba8" tick={{ fontSize:11, fontFamily:'DM Mono', fill:'#7a8ba8' }} />
              <Tooltip contentStyle={TT} labelStyle={TT_L} itemStyle={TT_ITEM} />
              <Bar dataKey="total" name="Gjithsej" radius={[4,4,0,0]}>
                {mergedDual().map((e,i) => <Cell key={i} fill={OBP_CLR} />)}
                <LabelList dataKey="total" position="top" style={{ fontSize:10, fill:'#7a8ba8', fontFamily:'DM Mono' }} />
              </Bar>
              <Bar dataKey="annulled" name="Anullime" radius={[4,4,0,0]}>
                {mergedDual().map((e,i) => <Cell key={i} fill={RED} />)}
                <LabelList dataKey="annulled" position="top" style={{ fontSize:10, fill:'#ef4444', fontFamily:'DM Mono' }} />
              </Bar>
              <Legend wrapperStyle={{ fontFamily:'DM Mono', fontSize:12, color:'#e8edf5' }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 9 — CHANGE #1: title updated */}
        <ChartCard title="Procedura të Anulluara (%) — viti vlerësimit">
          <BarC data={merged('annulledPct')} fmt={v=>`${v}%`} label="Anullime %" color={RED} /><Legend2 color={RED} />
        </ChartCard>

        {/* 10 — CHANGE #2: procPerMonth = count / last month in year */}
        <ChartCard title="Nr. Mesatar i Procedurave në Muaj (Gjithsej / Muajt deri në muajin e fundit)">
          <BarC data={merged('procPerMonth')} fmt={v=>`${v}`} label="Proc/muaj" amber /><Legend2 amber />
        </ChartCard>

        {/* 11 — CHANGE #2: fondiPerMonth = fondi / last month in year */}
        <ChartCard title="Fondi Mesatar në Muaj (mln €) — Fondi i Prokuruar / Muajt deri në muajin e fundit">
          <BarC data={merged('fondiPerMonth')} fmt={v=>`${v} mln €`} label="Fond/muaj" /><Legend2 />
        </ChartCard>

        {/* 12 — CHANGE #3: new chart — Fondi i Vlerësuar (mln €) */}
        <ChartCard title="Numri i procedurave të prokurimit të finalizuara (MILION EURO)" accent>
          <BarC data={merged('fondiVlerMlnEur')} fmt={v=>`${v} mln €`} label="Fondi i Vlerësuar" green /><Legend2 green />
        </ChartCard>

        {/* 13 — CHANGE #4: kursimi / fondi VLERËSUAR (was prokuruar) */}
        <ChartCard title="Kursimi / Fondi i Vlerësuar (%)" accent>
          <BarC data={merged('kursimiVlerPct')} fmt={v=>`${v}%`} label="Kursimi/Vlerësuar %" green /><Legend2 green />
        </ChartCard>

        {/* 14 */}
        <ChartCard title="Mesatarja në % e Kursimit të Procedurave ✓">
          <BarC data={merged('avgKursimiPct')} fmt={v=>`${v}%`} label="Mesatare %" color={CYAN} /><Legend2 color={CYAN} />
        </ChartCard>

        {/* 15 — CHANGE #5: new chart — Procedura të Përfunduara (Nr.) */}
        <ChartCard title="Numri i procedurave të prokurimit të FINALIZUARA" accent>
          <BarC data={merged('completed')} fmt={v=>`${v}`} label="Të Finalizuara" green /><Legend2 green />
        </ChartCard>

        {/* 16 — Status pie */}
        <ChartCard title="Statusi i Procedurave">
          {/* Increased height + radius so labels don't get cut off when printing */}
          <ResponsiveContainer width="100%" height={420}>
            <PieChart margin={{ top:20, right:120, left:120, bottom:40 }}>
              <Pie
                data={statusPie}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="42%"
                outerRadius={110}
                labelLine={{ stroke:'#7a8ba8', strokeWidth:1.5 }}
                label={({ name, percent, x, y, cx }) => {
                  // Split long names onto two lines
                  const parts = name.split(' ');
                  const mid   = Math.ceil(parts.length / 2);
                  const line1 = parts.slice(0, mid).join(' ');
                  const line2 = parts.slice(mid).join(' ');
                  const anchor = x > cx ? 'start' : 'end';
                  return (
                    <text x={x} y={y} fill="#e8edf5" fontSize={13} fontFamily="DM Mono"
                      textAnchor={anchor} dominantBaseline="central" fontWeight="600">
                      <tspan x={x} dy="-0.5em">{line1}</tspan>
                      {line2 && <tspan x={x} dy="1.3em">{line2}</tspan>}
                      <tspan x={x} dy="1.3em" fontSize={12} fontWeight="400">
                        {(percent*100).toFixed(0)}%
                      </tspan>
                    </text>
                  );
                }}
              >
                {statusPie.map((_,i) => <Cell key={i} fill={statusColors[i]} />)}
              </Pie>
              <Tooltip
                contentStyle={{...TT,color:'#e8edf5'}}
                itemStyle={{color:'#e8edf5'}}
                formatter={(v,n,p) => [`${v} procedura`, p.payload.name]}
              />
              <Legend
                wrapperStyle={{ fontFamily:'DM Mono', fontSize:13, color:'#e8edf5', paddingTop:8 }}
                formatter={(value) => <span style={{color:'#e8edf5', fontSize:13}}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="annulled-stat">
            <span className="ann-pct">{annulledPct}%</span>
            <span className="ann-label">anulluar ({annulled.length}/{rows.length}) · {formatMlnEur(annulledFondi)} mln €</span>
          </div>
        </ChartCard>

      </div>
    </main>
  );
}

function ChartCard({ title, children, accent }) {
  return (<div className={`chart-card${accent?' chart-card-accent':''}`}><h3 className="chart-title">{title}</h3>{children}</div>);
}

function BarC({ data, fmt, label, green, amber, domain, color }) {
  const clr = color || (green ? GREEN : amber ? AMBER : OBP_CLR);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top:10, right:10, left:0, bottom:40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#253047" />
        <XAxis dataKey="label" stroke="#7a8ba8" tick={{ fontSize:11, fontFamily:'DM Mono', fill:'#7a8ba8' }} angle={-35} textAnchor="end" interval={0} />
        <YAxis stroke="#7a8ba8" tick={{ fontSize:11, fontFamily:'DM Mono', fill:'#7a8ba8' }} domain={domain} />
        <Tooltip contentStyle={TT} labelStyle={TT_L} itemStyle={TT_ITEM} formatter={v=>[fmt(v), label]} />
        <Bar dataKey="value" radius={[4,4,0,0]}>
          {data.map((e,i) => <Cell key={i} fill={clr} />)}
          <LabelList dataKey="value" position="top" style={{ fontSize:10, fill:'#7a8ba8', fontFamily:'DM Mono' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Legend2({ green, amber, color }) {
  const clr = color || (green ? GREEN : amber ? AMBER : OBP_CLR);
  return (
    <div className="chart-legend">
      <span className="legend-dot" style={{ background: clr }} /> 2019–2024 (Para OBP/i pandryshuar)
      <span className="legend-dot" style={{ background: clr }} /> OBP (2024–2026)
    </div>
  );
}
