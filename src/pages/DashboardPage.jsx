import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList,
} from 'recharts';
import { formatNum, formatMlnEur, grandTotal, totalsByYear, uniqueYears } from '../utils/calculations';

// Historical data — proclamation fields by vitiShpalljes, evaluation fields by vitiVleresimit
const HISTORY = [
  { label:'2019',        procedures:158, annulled:51,  completed:107, fondiMlnEur:85,  kursimiMlnEur:3.3,  ofertave:3.7, operatoreve:3.7, procPerMonth:13.2, fondiPerMonth:7.08, annulledPct:32.28, suksesPct:67.72, kursimiPct:4.05  },
  { label:'2020',        procedures:267, annulled:86,  completed:181, fondiMlnEur:47,  kursimiMlnEur:5.1,  ofertave:3.8, operatoreve:3.8, procPerMonth:22.3, fondiPerMonth:3.92, annulledPct:32.21, suksesPct:67.79, kursimiPct:12.05 },
  { label:'2021',        procedures:187, annulled:64,  completed:123, fondiMlnEur:37,  kursimiMlnEur:4.6,  ofertave:3.6, operatoreve:3.6, procPerMonth:15.6, fondiPerMonth:3.08, annulledPct:34.22, suksesPct:65.78, kursimiPct:12.50 },
  { label:'2022',        procedures:204, annulled:67,  completed:137, fondiMlnEur:58,  kursimiMlnEur:4.6,  ofertave:3.3, operatoreve:3.3, procPerMonth:17.0, fondiPerMonth:4.83, annulledPct:32.84, suksesPct:67.16, kursimiPct:8.17  },
  { label:'2023',        procedures:171, annulled:74,  completed:97,  fondiMlnEur:39,  kursimiMlnEur:2.7,  ofertave:2.7, operatoreve:2.7, procPerMonth:14.3, fondiPerMonth:3.25, annulledPct:43.27, suksesPct:56.73, kursimiPct:5.14  },
  { label:'OBP 8M 2024', procedures:314, annulled:55,  completed:259, fondiMlnEur:168, kursimiMlnEur:18.4, ofertave:4.7, operatoreve:4.7, procPerMonth:34.9, fondiPerMonth:21.0, annulledPct:16.88, suksesPct:83.12, kursimiPct:11.64 },
];

const OBP_CLR  = '#3b82f6';
const HIST_CLR = '#374151';
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
  const grandFondiAll  = grandTotal(rows,      'fondiLimit'); // all rows — for prokuruar
  const grandFondiComp = grandTotal(completed, 'fondiLimit'); // completed — for vlerësuar
  const grandKursimi   = grandTotal(completed, 'kursimi');
  const avgPct         = grandFondiComp > 0 ? (grandKursimi / grandFondiComp * 100) : 0;
  const annulledPct    = rows.length > 0 ? (annulled.length / rows.length * 100).toFixed(1) : '0.0';
  const annulledFondi  = grandTotal(annulled, 'fondiLimit');

  // Proclamation-based breakdowns (vitiShpalljes)
  const countByYear = {}, annulledByYear = {}, annulledFondiByYear = {}, fondiProkByYear = {};
  years.forEach(y => {
    const yShp = rows.filter(r => (r.vitiShpalljes || r.year) === y);
    const yAnn = annulled.filter(r => (r.vitiShpalljes || r.year) === y);
    countByYear[y]         = yShp.length;
    annulledByYear[y]      = yAnn.length;
    annulledFondiByYear[y] = grandTotal(yAnn, 'fondiLimit');
    fondiProkByYear[y]     = grandTotal(yShp, 'fondiLimit');
  });

  // Evaluation-based breakdowns (vitiVleresimit)
  const completedByYear = {}, fondiVlerByYear = {};
  const totKurs      = totalsByYear(completed, 'kursimi',    'vitiVleresimit');
  const totFondiVler = totalsByYear(completed, 'fondiLimit', 'vitiVleresimit');
  years.forEach(y => {
    const yComp = completed.filter(r => (r.vitiVleresimit || r.year) === y);
    completedByYear[y] = yComp.length;
    fondiVlerByYear[y] = grandTotal(yComp, 'fondiLimit');
  });

  // Build live chart data per year
  const liveByYear = years.map(y => {
    const yShp  = rows.filter(r => (r.vitiShpalljes  || r.year) === y);
    const yAnn  = annulled.filter(r => (r.vitiShpalljes || r.year) === y);
    const yComp = completed.filter(r => (r.vitiVleresimit || r.year) === y);
    const fondiP = fondiProkByYear[y] || 0;
    const kurs   = totKurs[y] || 0;

    // ofertave & operatoreve: ONLY from completed procedures (per user request)
    const avgOf = yComp.length > 0 ? yComp.reduce((s,r) => s + Number(r.nrOfertave    ||0),0) / yComp.length : 0;
    const avgOe = yComp.length > 0 ? yComp.reduce((s,r) => s + Number(r.nrOperatoreve ||0),0) / yComp.length : 0;

    // suksesPct = (total - annulled) / total — per user request
    const sukses     = yShp.length - yAnn.length;
    const suksesPct  = yShp.length > 0 ? (sukses / yShp.length * 100) : 0;
    const annPct     = yShp.length > 0 ? (yAnn.length  / yShp.length * 100) : 0;
    // kursimiPct = kursimi / fondi prokuruar (consistent with prokuruar KPI)
    const kursimiPct = fondiP > 0 ? (kurs / fondiP * 100) : 0;
    const avgKursimiPct = yComp.length > 0 ? yComp.reduce((s,r) => s+(Number(r.kursimiPct)||0),0)/yComp.length : 0;

    // Procedures per month (by dataShpalljes)
    const months = new Set();
    yShp.forEach(r => { if (r.dataShpalljes) { const p = r.dataShpalljes.split('/'); if (p.length===3) months.add(p[0]+'/'+p[2]); } });
    const nMonths = months.size || 1;

    return {
      label: String(y), isObp: true,
      procedures:    yShp.length,
      annulled:      yAnn.length,
      completed:     yComp.length,
      fondiMlnEur:   parseFloat(formatMlnEur(fondiP)),
      kursimiMlnEur: parseFloat(formatMlnEur(kurs)),
      ofertave:      parseFloat(avgOf.toFixed(1)),
      operatoreve:   parseFloat(avgOe.toFixed(1)),
      sukses:        sukses,
      suksesPct:     parseFloat(suksesPct.toFixed(1)),
      annulledPct:   parseFloat(annPct.toFixed(1)),
      kursimiPct:    parseFloat(kursimiPct.toFixed(2)),
      avgKursimiPct: parseFloat(avgKursimiPct.toFixed(2)),
      procPerMonth:  parseFloat((yShp.length / nMonths).toFixed(1)),
      fondiPerMonth: parseFloat((fondiP / nMonths / 100_000_000).toFixed(2)),
    };
  });

  function merged(field) {
    return [
      ...HISTORY.map(h => ({ label: h.label, value: field === 'sukses' ? (h.procedures - h.annulled) : (h[field] ?? 0), isObp: false })),
      ...liveByYear.map(l => ({ label: l.label, value: l[field] ?? 0, isObp: true })),
    ];
  }

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
      </header>

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
        <div className="kpi kpi-red">
          <div className="kpi-label">✗ Të Anulluara (viti shpalljes)</div>
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

      <div className="dash-grid">
        <ChartCard title="Numri i Procedurave (viti shpalljes)"><BarC data={merged('procedures')} fmt={v=>`${v}`} label="Procedura" /><Legend2 /></ChartCard>
        <ChartCard title="Fonde të Prokuruara (mln €) — viti shpalljes"><BarC data={merged('fondiMlnEur')} fmt={v=>`${v} mln €`} label="Fondi" /><Legend2 /></ChartCard>
        <ChartCard title="Kursimet (mln €) — vetëm ✓ të përfunduarat" accent><BarC data={merged('kursimiMlnEur')} fmt={v=>`${v} mln €`} label="Kursimi" green /><Legend2 green /></ChartCard>
        <ChartCard title="Numri Mesatar i Ofertave — vetëm ✓ të përfunduarat"><BarC data={merged('ofertave')} fmt={v=>`${v}`} label="Oferta" amber domain={[0,8]} /><Legend2 amber /></ChartCard>
        <ChartCard title="Numri Mesatar i Operatorëve Ekonomikë — vetëm ✓ të përfunduarat"><BarC data={merged('operatoreve')} fmt={v=>`${v}`} label="OE" color={PURPLE} /><Legend2 color={PURPLE} /></ChartCard>
        <ChartCard title="Procedura të Suksesshme (Nr.) = Gjithsej − Anullime (viti shpalljes)"><BarC data={merged('sukses')} fmt={v=>`${v}`} label="Sukses" green /><Legend2 green /></ChartCard>
        <ChartCard title="Procedura të Suksesshme (%) = (Gjithsej − Anullime) / Gjithsej"><BarC data={merged('suksesPct')} fmt={v=>`${v}%`} label="Sukses %" green /><Legend2 green /></ChartCard>
        <ChartCard title="Procedura Gjithsej vs Anullime (viti shpalljes)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mergedDual()} margin={{ top:10, right:10, left:0, bottom:40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#253047" />
              <XAxis dataKey="label" stroke="#7a8ba8" tick={{ fontSize:11, fontFamily:'DM Mono', fill:'#7a8ba8' }} angle={-35} textAnchor="end" interval={0} />
              <YAxis stroke="#7a8ba8" tick={{ fontSize:11, fontFamily:'DM Mono', fill:'#7a8ba8' }} />
              <Tooltip contentStyle={TT} labelStyle={TT_L} itemStyle={TT_ITEM} />
              <Bar dataKey="total" name="Gjithsej" fill={OBP_CLR} radius={[4,4,0,0]}><LabelList dataKey="total" position="top" style={{ fontSize:10, fill:'#7a8ba8', fontFamily:'DM Mono' }} /></Bar>
              <Bar dataKey="annulled" name="Anullime" fill={RED} radius={[4,4,0,0]}><LabelList dataKey="annulled" position="top" style={{ fontSize:10, fill:'#ef4444', fontFamily:'DM Mono' }} /></Bar>
              <Legend wrapperStyle={{ fontFamily:'DM Mono', fontSize:12, color:'#e8edf5' }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Procedura të Anulluara (%) — viti shpalljes"><BarC data={merged('annulledPct')} fmt={v=>`${v}%`} label="Anullime %" color={RED} /><Legend2 color={RED} /></ChartCard>
        <ChartCard title="Nr. Mesatar i Procedurave në Muaj"><BarC data={merged('procPerMonth')} fmt={v=>`${v}`} label="Proc/muaj" amber /><Legend2 amber /></ChartCard>
        <ChartCard title="Fondi Mesatar në Muaj (mln €)"><BarC data={merged('fondiPerMonth')} fmt={v=>`${v} mln €`} label="Fond/muaj" /><Legend2 /></ChartCard>
        <ChartCard title="Kursimi / Fondi i Prokuruar (%)" accent><BarC data={merged('kursimiPct')} fmt={v=>`${v}%`} label="Kursimi %" green /><Legend2 green /></ChartCard>
        <ChartCard title="Mesatarja në % e Kursimit të Procedurave ✓"><BarC data={merged('avgKursimiPct')} fmt={v=>`${v}%`} label="Mesatare %" color={CYAN} /><Legend2 color={CYAN} /></ChartCard>
        <ChartCard title="Statusi i Procedurave">
          <ResponsiveContainer width="100%" height={340}>
            <PieChart margin={{ top:10, right:80, left:80, bottom:10 }}>
              <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85}
                label={({ name, percent, x, y, cx }) => (
                  <text x={x} y={y} fill="#e8edf5" fontSize={12} fontFamily="DM Mono" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                    {`${name}: ${(percent*100).toFixed(0)}%`}
                  </text>
                )} labelLine={{ stroke:'#7a8ba8' }}>
                {statusPie.map((_,i) => <Cell key={i} fill={statusColors[i]} />)}
              </Pie>
              <Tooltip contentStyle={TT} labelStyle={TT_L} itemStyle={TT_ITEM} formatter={(v,n,p) => [`${v} procedura`, p.payload.name]} />
              <Legend wrapperStyle={{ fontFamily:'DM Mono', fontSize:12, color:'#e8edf5' }} />
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
          {data.map((e,i) => <Cell key={i} fill={e.isObp ? clr : HIST_CLR} />)}
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
      <span className="legend-dot" style={{ background: HIST_CLR }} /> 2019–2023 (Para OBP)
      <span className="legend-dot" style={{ background: clr }} /> OBP (2024–2026)
    </div>
  );
}
