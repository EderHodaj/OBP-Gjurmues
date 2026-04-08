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
  const annulledFondi  = grandTotal(annulled, 'fondiLimit');

  const totKurs  = totalsByYear(completed, 'kursimi');
  const totFondi = totalsByYear(rows,      'fondiLimit');

  // Year breakdowns
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

  // Build live-year bars
  const liveByYear = years.map(y => {
    const yrows = rows.filter(r => r.year === y);
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
        <h1 className="page-title">Procedurat e Prokurimit — OBP</h1>
        <p className="page-sub">Krahasim historik · {rows.length} procedura gjithsej · Kursimi llogaritet vetëm nga procedurat ✓ të përfunduara</p>
      </header>

      {/* ── KPIs ── */}
      <div className="dash-kpis">
        <div className="kpi kpi-blue">
          <div className="kpi-label">Procedura Gjithsej</div>
          <div className="kpi-value">{rows.length}</div>
          {years.map(y => (
            <div className="kpi-sub" key={y}>{y}: {countByYear[y]}</div>
          ))}
        </div>

        <div className="kpi kpi-green">
          <div className="kpi-label">✓ Të Përfunduara</div>
          <div className="kpi-value">{completed.length}</div>
          <div className="kpi-sub">{rows.length>0?(completed.length/rows.length*100).toFixed(1):0}% e totalit</div>
          {years.map(y => (
            <div className="kpi-sub" key={y}>{y}: {completedByYear[y]}</div>
          ))}
        </div>

        <div className="kpi kpi-red">
          <div className="kpi-label">✗ Të Anulluara</div>
          <div className="kpi-value">{annulled.length}</div>
          <div className="kpi-sub">{annulledPct}% · {formatMlnEur(annulledFondi)} mln €</div>
          {years.map(y => (
            <div className="kpi-sub" key={y}>{y}: {annulledByYear[y]} ({formatMlnEur(annulledFondiByYear[y])} mln €)</div>
          ))}
        </div>

        <div className="kpi kpi-blue">
          <div className="kpi-label">Fondi i Prokuruar (gjithsej)</div>
          <div className="kpi-value">{formatMlnEur(grandFondiAll)} mln €</div>
          <div className="kpi-sub">{formatNum(grandFondiAll)} Lekë</div>
          {years.map(y => (
            <div className="kpi-sub" key={y}>{y}: {formatMlnEur(fondiProkByYear[y])} mln €</div>
          ))}
        </div>

        <div className="kpi kpi-green">
          <div className="kpi-label">Fondi i Vlerësuar (✓)</div>
          <div className="kpi-value">{formatMlnEur(grandFondiComp)} mln €</div>
          <div className="kpi-sub">{formatNum(grandFondiComp)} Lekë</div>
          {vYears.map(y => (
            <div className="kpi-sub" key={y}>{y}: {formatMlnEur(fondiVlerByYear[y])} mln €</div>
          ))}
        </div>

        <div className="kpi kpi-green">
          <div className="kpi-label">Kursimi Total (✓)</div>
          <div className="kpi-value">{formatMlnEur(grandKursimi)} mln €</div>
          <div className="kpi-sub">Mesatare: {avgPct.toFixed(2)}%</div>
        </div>

        {years.map(y => (
          <div className="kpi kpi-amber" key={y}>
            <div className="kpi-label">Kursimi {y} (✓)</div>
            <div className="kpi-value">{formatMlnEur(totKurs[y]||0)} mln €</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <ChartCard title="Numri i Procedurave të Shpallura">
          <BarC data={merged('procedures')} fmt={v=>`${v}`} label="Procedura" />
          <Legend2 />
        </ChartCard>

        <ChartCard title="Fonde të Prokuruara (mln €)">
          <BarC data={merged('fondiMlnEur')} fmt={v=>`${v} mln €`} label="Fondi" />
          <Legend2 />
        </ChartCard>

        <ChartCard title="Kursimet (mln €) — vetëm ✓ të përfunduarat" accent>
          <BarC data={merged('kursimiMlnEur')} fmt={v=>`${v} mln €`} label="Kursimi" green />
          <Legend2 green />
        </ChartCard>

        <ChartCard title="Numri Mesatar i Ofertave">
          <BarC data={merged('ofertave')} fmt={v=>`${v}`} label="Oferta" amber domain={[0,6]} />
          <Legend2 amber />
        </ChartCard>

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
          <div className="annulled-stat">
            <span className="ann-pct">{annulledPct}%</span>
            <span className="ann-label">
              e procedurave janë anulluar ({annulled.length} nga {rows.length}) · Vlera: {formatMlnEur(annulledFondi)} mln € ({formatNum(annulledFondi)} Lekë)
            </span>
          </div>
        </ChartCard>
      </div>
    </main>
  );
}

/* ── Helpers ── */
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
