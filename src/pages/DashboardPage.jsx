import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList,
} from 'recharts';
import { formatNum, formatMlnEur, grandTotal, totalsByYear, uniqueYears } from '../utils/calculations';

const HISTORY = [
  { label:'2019', procedures:158, fondiMlnEur:85,   kursimiMlnEur:3.3,  ofertave:3.7 },
  { label:'2020', procedures:267, fondiMlnEur:47,   kursimiMlnEur:5.1,  ofertave:3.8 },
  { label:'2021', procedures:187, fondiMlnEur:37,   kursimiMlnEur:4.6,  ofertave:3.6 },
  { label:'2022', procedures:204, fondiMlnEur:58,   kursimiMlnEur:4.6,  ofertave:3.3 },
  { label:'2023', procedures:171, fondiMlnEur:39,   kursimiMlnEur:2.7,  ofertave:2.7 },
  { label:'OBP (8 muaj 2024)', procedures:314, fondiMlnEur:168, kursimiMlnEur:18.4, ofertave:4.7 },
];

const OBP_CLR  = '#3b82f6';
const HIST_CLR = '#374151';
const GREEN    = '#10b981';
const AMBER    = '#f59e0b';
const RED      = '#ef4444';
const PIE_CLR  = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];
const TT       = { background:'#131926', border:'1px solid #253047', borderRadius:8, color:'#e8edf5', fontFamily:'DM Mono,monospace', fontSize:12 };
const TT_L     = { color:'#3b82f6' };

export default function DashboardPage({ rows }) {
  if (rows.length === 0) return (
    <main className="page">
      <div className="info-banner">Nuk ka të dhëna — shtoni rreshta në faqen Tabela.</div>
    </main>
  );

  const completed = rows.filter(r =>  r.ePerfunduar && !r.eAnulluar);
  const annulled  = rows.filter(r =>  r.eAnulluar);
  const active    = rows.filter(r => !r.ePerfunduar && !r.eAnulluar);
  const years     = uniqueYears(rows);

  const grandFondiAll  = grandTotal(rows,      'fondiLimit');
  const grandFondiComp = grandTotal(completed, 'fondiLimit');
  const grandKursimi   = grandTotal(completed, 'kursimi');
  const avgPct         = grandFondiComp > 0 ? (grandKursimi / grandFondiComp * 100) : 0;
  const annulledPct    = rows.length > 0 ? (annulled.length / rows.length * 100).toFixed(1) : '0.0';

  const totKurs  = totalsByYear(completed, 'kursimi');
  const totFondi = totalsByYear(rows,      'fondiLimit');

  // Build live-year bars
  const liveByYear = years.map(y => {
    const yrows = rows.filter(r => r.year === y);
    const ycomp = completed.filter(r => r.year === y);
    const fondi = totFondi[y] || 0;
    const kurs  = totKurs[y]  || 0;
    const avgOf = yrows.length > 0 ? yrows.reduce((s,r) => s+Number(r.nrOfertave||0),0)/yrows.length : 0;
    return {
      label: String(y),
      procedures:    yrows.length,
      fondiMlnEur:   parseFloat(formatMlnEur(fondi)),
      kursimiMlnEur: parseFloat(formatMlnEur(kurs)),
      ofertave:      parseFloat(avgOf.toFixed(1)),
      isObp: true,
    };
  });

  function merged(field) {
    return [
      ...HISTORY.map(h => ({ label:h.label, value:h[field], isObp:false })),
      ...liveByYear.map(l => ({ label:l.label, value:l[field], isObp:true })),
    ];
  }

  // Lloji breakdown
  const llojtData = Object.entries(
    rows.reduce((acc, r) => {
      const l = r.lloji || 'Tjetër';
      if (!acc[l]) acc[l] = { count:0, kursimi:0, fondi:0, annulled:0 };
      acc[l].count++;
      acc[l].kursimi += Number(r.kursimi||0);
      acc[l].fondi   += Number(r.fondiLimit||0);
      if (r.eAnulluar) acc[l].annulled++;
      return acc;
    }, {})
  ).map(([name,v]) => ({
    name,
    count: v.count,
    kursimiMlnEur: parseFloat(formatMlnEur(v.kursimi)),
    pct: v.fondi > 0 ? parseFloat((v.kursimi/v.fondi*100).toFixed(1)) : 0,
    annulledPct: v.count > 0 ? parseFloat((v.annulled/v.count*100).toFixed(1)) : 0,
  })).sort((a,b) => b.count - a.count);

  // Top 10 savings (completed only)
  const top10 = [...completed]
    .filter(r => Number(r.kursimi) > 0)
    .sort((a,b) => Number(b.kursimi) - Number(a.kursimi))
    .slice(0,10);

  // Status pie
  const statusPie = [
    { name:'Në proces',      value: active.length    },
    { name:'Të përfunduara', value: completed.length },
    { name:'Të anulluara',   value: annulled.length  },
  ].filter(d => d.value > 0);
  const statusColors = [AMBER, GREEN, RED];

  return (
    <main className="page">
      <header className="page-hdr">
        <h1 className="page-title">Paneli i Kursimeve — OBP</h1>
        <p className="page-sub">Krahasim historik · {rows.length} procedura gjithsej · Kursimi llogaritet vetëm nga procedurat ✓ të përfunduara</p>
      </header>

      {/* ── KPIs ── */}
      <div className="dash-kpis">
        <KPI label="Procedura Gjithsej"      value={rows.length}                          color="blue" />
        <KPI label="✓ Të Përfunduara"        value={completed.length}                     color="green"
             sub={`${rows.length>0?(completed.length/rows.length*100).toFixed(1):0}% e totalit`} />
        <KPI label="✗ Të Anulluara"          value={annulled.length}                      color="red"
             sub={`${annulledPct}% e totalit`} />
        <KPI label="Fondi i Prokuruar (gjithsej)" value={`${formatMlnEur(grandFondiAll)} mln €`} color="blue"
             sub={formatNum(grandFondiAll)+' Lekë'} />
        <KPI label="Fondi i Vlerësuar (✓)"   value={`${formatMlnEur(grandFondiComp)} mln €`} color="green"
             sub={formatNum(grandFondiComp)+' Lekë'} />
        <KPI label="Kursimi Total (✓)"        value={`${formatMlnEur(grandKursimi)} mln €`}   color="green"
             sub={`Mesatare: ${avgPct.toFixed(2)}%`} />
        {years.map(y => (
          <KPI key={y} label={`Kursimi ${y} (✓)`}
               value={`${formatMlnEur(totKurs[y]||0)} mln €`} color="amber" />
        ))}
      </div>

      <div className="dash-grid">

        {/* 1 — Numri procedurave */}
        <ChartCard title="Numri i Procedurave të Shpallura">
          <BarC data={merged('procedures')} fmt={v=>`${v}`} label="Procedura" />
          <Legend2 />
        </ChartCard>

        {/* 2 — Fonde */}
        <ChartCard title="Fonde të Prokuruara (mln €)">
          <BarC data={merged('fondiMlnEur')} fmt={v=>`${v} mln €`} label="Fondi" />
          <Legend2 />
        </ChartCard>

        {/* 3 — Kursimet ← KEY CHART */}
        <ChartCard title="Kursimet (mln €) — vetëm ✓ të përfunduarat" accent>
          <BarC data={merged('kursimiMlnEur')} fmt={v=>`${v} mln €`} label="Kursimi" green />
          <Legend2 green />
        </ChartCard>

        {/* 4 — Oferta mesatare */}
        <ChartCard title="Numri Mesatar i Ofertave">
          <BarC data={merged('ofertave')} fmt={v=>`${v}`} label="Oferta" amber domain={[0,6]} />
          <Legend2 amber />
        </ChartCard>

        {/* 5 — Status pie */}
        <ChartCard title="Statusi i Procedurave">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusPie} dataKey="value" nameKey="name" cx="40%" cy="50%"
                outerRadius={90} label={({name,percent}) => `${name}: ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {statusPie.map((_,i) => <Cell key={i} fill={statusColors[i]} />)}
              </Pie>
              <Tooltip contentStyle={TT} formatter={(v,n,p) => [`${v} procedura`, p.payload.name]} />
              <Legend wrapperStyle={{ fontFamily:'DM Mono', fontSize:12, color:'#e8edf5' }} />
            </PieChart>
          </ResponsiveContainer>
          {/* Annulment stat callout */}
          <div className="annulled-stat">
            <span className="ann-pct">{annulledPct}%</span>
            <span className="ann-label">e procedurave janë anulluar ({annulled.length} nga {rows.length})</span>
          </div>
        </ChartCard>

        {/* 6 — Kursimi % sipas llojit */}
        <ChartCard title="Kursimi % sipas Llojit të Procedurës">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={llojtData} layout="vertical" margin={{ top:5, right:55, left:30, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#253047" />
              <XAxis type="number" stroke="#7a8ba8" tick={{ fontSize:11, fontFamily:'DM Mono', fill:'#7a8ba8' }} tickFormatter={v=>`${v}%`} />
              <YAxis type="category" dataKey="name" stroke="#7a8ba8" tick={{ fontSize:12, fontFamily:'DM Mono', fill:'#7a8ba8' }} width={40} />
              <Tooltip contentStyle={TT} labelStyle={TT_L} formatter={v=>[`${v}%`,'Kursimi mesatar']} />
              <Bar dataKey="pct" radius={[0,4,4,0]} fill={GREEN}>
                <LabelList dataKey="pct" position="right" style={{ fontSize:11, fill:'#10b981', fontFamily:'DM Mono' }} formatter={v=>`${v}%`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* ── Top 10 ── */}
      <section className="section">
        <h2 className="section-title">Top 10 Kursimet më të Mëdha (✓ të përfunduara)</h2>
        {top10.length === 0 ? (
          <div className="info-banner">Asnjë procedurë e përfunduar akoma — çekoni ✓ në tabelë.</div>
        ) : (
          <div className="table-scroll">
            <table className="btable">
              <thead>
                <tr>
                  <th>#</th>
                  <th style={{minWidth:300}}>Objektet</th>
                  <th>Viti</th>
                  <th>Fondi Limit</th>
                  <th>Vlera Fituesit</th>
                  <th>Ne %</th>
                  <th>Kursimi (Lekë)</th>
                  <th>Kursimi %</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((r,i) => (
                  <tr key={r.id}>
                    <td>{i+1}</td>
                    <td style={{fontSize:12}}>{r.description}</td>
                    <td>{r.year}</td>
                    <td>{formatNum(r.fondiLimit)}</td>
                    <td>{formatNum(r.vleraFituesit)}</td>
                    <td>{Number(r.nePct||0).toFixed(2)}%</td>
                    <td className="kursimi-cell positive">{formatNum(r.kursimi)}</td>
                    <td className="kursimi-cell positive">{Number(r.kursimiPct||0).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

/* ── Helpers ── */
function KPI({ label, value, sub, color='blue' }) {
  return (
    <div className={`kpi kpi-${color}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function ChartCard({ title, children, accent }) {
  return (
    <div className={`chart-card${accent?' chart-card-accent':''}`}>
      <h3 className="chart-title">{title}</h3>
      {children}
    </div>
  );
}

function BarC({ data, fmt, label, green, amber, domain }) {
  const color = green ? GREEN : amber ? AMBER : OBP_CLR;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top:10, right:10, left:0, bottom:40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#253047" />
        <XAxis dataKey="label" stroke="#7a8ba8" tick={{ fontSize:11, fontFamily:'DM Mono', fill:'#7a8ba8' }} angle={-35} textAnchor="end" interval={0} />
        <YAxis stroke="#7a8ba8" tick={{ fontSize:11, fontFamily:'DM Mono', fill:'#7a8ba8' }} domain={domain} />
        <Tooltip contentStyle={TT} labelStyle={TT_L} formatter={v=>[fmt(v), label]} />
        <Bar dataKey="value" radius={[4,4,0,0]}>
          {data.map((e,i) => <Cell key={i} fill={e.isObp ? color : HIST_CLR} />)}
          <LabelList dataKey="value" position="top" style={{ fontSize:10, fill:'#7a8ba8', fontFamily:'DM Mono' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Legend2({ green, amber }) {
  const color = green ? GREEN : amber ? AMBER : OBP_CLR;
  return (
    <div className="chart-legend">
      <span className="legend-dot" style={{ background:HIST_CLR }} /> 2019–2023 (Para OBP)
      <span className="legend-dot" style={{ background:color }} /> OBP (2024–2026)
    </div>
  );
}
