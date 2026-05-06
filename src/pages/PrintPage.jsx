import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
  PieChart, Pie, Legend,
} from 'recharts';
import { formatMlnEur, formatNum, grandTotal, totalsByYear, uniqueYears } from '../utils/calculations';

const GREEN  = '#10b981';
const AMBER  = '#f59e0b';
const RED    = '#ef4444';
const PURPLE = '#8b5cf6';
const CYAN   = '#06b6d4';
const BLUE   = '#3b82f6';
const HIST   = '#374151';

const HISTORY = [
  { label:'2019',        procedures:158, annulled:51,  completed:107, fondiMlnEur:85,  fondiVlerMlnEur:85,  kursimiMlnEur:3.3,  ofertave:3.7, operatoreve:3.7, procPerMonth:13.2, fondiPerMonth:7.08, annulledPct:32.28, suksesPct:67.72, kursimiVlerPct:4,     avgKursimiPct:11 },
  { label:'2020',        procedures:267, annulled:86,  completed:181, fondiMlnEur:47,  fondiVlerMlnEur:47,  kursimiMlnEur:5.1,  ofertave:3.8, operatoreve:3.8, procPerMonth:22.3, fondiPerMonth:3.92, annulledPct:32.21, suksesPct:67.79, kursimiVlerPct:12,    avgKursimiPct:20 },
  { label:'2021',        procedures:187, annulled:64,  completed:123, fondiMlnEur:37,  fondiVlerMlnEur:37,  kursimiMlnEur:4.6,  ofertave:3.6, operatoreve:3.6, procPerMonth:15.6, fondiPerMonth:3.08, annulledPct:34.22, suksesPct:65.78, kursimiVlerPct:12.5,  avgKursimiPct:22 },
  { label:'2022',        procedures:204, annulled:67,  completed:137, fondiMlnEur:58,  fondiVlerMlnEur:58,  kursimiMlnEur:4.6,  ofertave:3.3, operatoreve:3.3, procPerMonth:17.0, fondiPerMonth:4.83, annulledPct:32.84, suksesPct:67.16, kursimiVlerPct:8,     avgKursimiPct:17 },
  { label:'2023',        procedures:171, annulled:74,  completed:97,  fondiMlnEur:39,  fondiVlerMlnEur:39,  kursimiMlnEur:2.7,  ofertave:2.7, operatoreve:2.7, procPerMonth:14.3, fondiPerMonth:3.25, annulledPct:43.27, suksesPct:56.73, kursimiVlerPct:5,     avgKursimiPct:16 },
  { label:'OBP 8M 2024', procedures:314, annulled:55,  completed:259, fondiMlnEur:168, fondiVlerMlnEur:158, kursimiMlnEur:18.4, ofertave:4.7, operatoreve:4.7, procPerMonth:34.9, fondiPerMonth:21.0, annulledPct:16.88, suksesPct:83.12, kursimiVlerPct:11.64, avgKursimiPct:17 },
  { label:'2025',        procedures:578, annulled:106, completed:290, fondiMlnEur:194, fondiVlerMlnEur:97.2, kursimiMlnEur:12.8, ofertave:4.3, operatoreve:5.1, procPerMonth:48.2, fondiPerMonth:16.2, annulledPct:18,    suksesPct:82,   kursimiVlerPct:13.2,  avgKursimiPct:16, sukses:472 },
];
const HISTORY_YEARS = new Set(HISTORY.map(h => h.label));

const TT   = { background:'#fff', border:'1px solid #ccc', borderRadius:6, color:'#000', fontSize:13 };
const TT_L = { color:'#1d4ed8', fontWeight:'bold' };
const TT_I = { color:'#000' };

function mergedData(liveByYear, field) {
  return [
    ...HISTORY.map(h => ({ label:h.label, value: field==='sukses'?(h.procedures-h.annulled):(h[field]??0), isObp:false })),
    ...liveByYear.map(l => ({ label:l.label, value:l[field]??0, isObp:true })),
  ];
}

const CSS = `
  @page { size: A4 landscape; margin: 6mm; }
  * { box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  body { margin:0; padding:0; background:#fff; font-family:'Sora',Arial,sans-serif; }

  .print-page {
    width: 277mm;
    height: 190mm;
    padding: 4mm 6mm 2mm 6mm;
    page-break-after: always;
    break-after: page;
    overflow: hidden;
    background: #fff;
    display: flex;
    flex-direction: column;
  }

  .print-page:last-child {
    page-break-after: avoid;
    break-after: avoid;
  }

  h2 {
    font-size: 13pt;
    font-weight: 700;
    color: #000;
    text-align: center;
    margin: 0 0 2mm 0;
    flex-shrink: 0;
  }

  .chart-wrap {
    flex: 1;
    min-height: 0;
  }

  .legend {
    text-align: center;
    font-size: 10pt;
    color: #333;
    margin-top: 2mm;
    flex-shrink: 0;
  }

  .dot {
    display: inline-block;
    width: 10px; height: 10px;
    border-radius: 50%;
    margin-right: 4px;
    vertical-align: middle;
  }

  .print-btn {
    position: fixed; top:10px; right:10px;
    padding: 10px 22px;
    background: #2563eb; color:#fff;
    border:none; border-radius:6px;
    font-size:15px; cursor:pointer; z-index:999;
  }

  @media print { .print-btn { display:none !important; } }

  /* KPI faqja e parë */
  .kpi-page {
    width: 277mm;
    height: 190mm;
    padding: 6mm 6mm 4mm 6mm;
    page-break-after: always;
    break-after: page;
    overflow: hidden;
    background: #fff;
    display: flex;
    flex-direction: column;
  }
  .kpi-page-title {
    font-size: 16pt;
    font-weight: 700;
    color: #000;
    text-align: center;
    margin: 0 0 4mm 0;
  }
  .kpi-page-sub {
    font-size: 10pt;
    color: #555;
    text-align: center;
    margin: 0 0 5mm 0;
  }
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4mm;
    flex: 1;
  }
  .kpi-card {
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 4mm;
    display: flex;
    flex-direction: column;
    gap: 2mm;
  }
  .kpi-card-blue  { border-top: 3px solid #2563eb; }
  .kpi-card-green { border-top: 3px solid #059669; }
  .kpi-card-red   { border-top: 3px solid #dc2626; }
  .kpi-card-label {
    font-size: 8pt;
    font-weight: 700;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .kpi-card-value {
    font-size: 20pt;
    font-weight: 700;
    color: #000;
    line-height: 1;
  }
  .kpi-card-sub {
    font-size: 8pt;
    color: #666;
  }
  .kpi-years {
    display: flex;
    flex-wrap: wrap;
    gap: 2mm;
    margin-top: 1mm;
  }
  .kpi-year-box {
    background: #f0f4ff;
    border: 1px solid #aabbdd;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 8pt;
  }
  .kpi-year-lbl { color: #2563eb; font-weight: 700; margin-right: 4px; }
  .kpi-year-val { color: #000; font-weight: 600; }
  .kpi-year-det { color: #555; font-size: 7pt; margin-left: 3px; }
`;

function KpiPage({ rows, completed, annulled, years, fondiProkByYear, totKurs, totFondiVler, completedByYear, annulledByYear, annulledFondiByYear, fondiVlerByYear, historyData, liveYears }) {
  const grandFondiAll  = grandTotal(rows,      'fondiLimit');
  const grandFondiComp = grandTotal(completed, 'fondiLimit');
  const grandKursimi   = grandTotal(completed, 'kursimi');
  const avgPct         = grandFondiComp > 0 ? (grandKursimi / grandFondiComp * 100) : 0;
  const annulledFondi  = grandTotal(annulled, 'fondiLimit');
  const annulledPct    = rows.length > 0 ? (annulled.length / rows.length * 100).toFixed(1) : '0.0';

  // Build per-year data combining HISTORY (fixed) + live data
  const histMap = Object.fromEntries((historyData||[]).map(h => [h.label, h]));

  function getCount(y) {
    if (histMap[y]) return histMap[y].procedures;
    // Live year — count all rows by vitiShpalljes
    const yr = typeof y === 'string' ? parseInt(y) : y;
    return rows.filter(r => (r.vitiShpalljes || r.year) === yr).length;
  }
  function getCompleted(y) { return histMap[y] ? histMap[y].completed : (completedByYear[y]||0); }
  function getAnnulled(y)  { return histMap[y] ? histMap[y].annulled  : (annulledByYear[y]||0); }
  function getFondiProk(y) { return histMap[y] ? histMap[y].fondiMlnEur*100_000_000 : (fondiProkByYear[y]||0); }
  function getFondiVler(y) { return histMap[y] ? histMap[y].fondiVlerMlnEur*100_000_000 : (fondiVlerByYear[y]||0); }
  function getKursimi(y)   { return histMap[y] ? histMap[y].kursimiMlnEur*100_000_000 : (totKurs[y]||0); }

  function YearBoxes({ getFn }) {
    return (
      <div className="kpi-years">
        {years.map(y => (
          <div className="kpi-year-box" key={y}>
            <span className="kpi-year-lbl">{y}</span>
            <span className="kpi-year-val">{getFn(y)}</span>
          </div>
        ))}
      </div>
    );
  }

  function YearBoxesFondi({ getFn }) {
    return (
      <div className="kpi-years">
        {years.map(y => (
          <div className="kpi-year-box" key={y}>
            <span className="kpi-year-lbl">{y}</span>
            <span className="kpi-year-val">{formatMlnEur(getFn(y))} mln €</span>
          </div>
        ))}
      </div>
    );
  }

  function YearBoxesAnn() {
    return (
      <div className="kpi-years">
        {years.map(y => (
          <div className="kpi-year-box" key={y}>
            <span className="kpi-year-lbl">{y}</span>
            <span className="kpi-year-val">{getAnnulled(y)}</span>
            <span className="kpi-year-det">{formatMlnEur(histMap[y] ? 0 : (annulledFondiByYear[y]||0))} mln €</span>
          </div>
        ))}
      </div>
    );
  }

  const kursimiByYear = {};
  years.forEach(y => { kursimiByYear[y] = totKurs[y]||0; });

  return (
    <div className="kpi-page">
      <div className="kpi-page-title">Procedurat e Prokurimit — OBP</div>
      <div className="kpi-page-sub">{rows.length} procedura gjithsej · Krahasim sipas vitit</div>
      <div className="kpi-grid">

        <div className="kpi-card kpi-card-blue">
          <div className="kpi-card-label">Procedura Gjithsej (viti shpalljes)</div>
          <div className="kpi-card-value">{rows.length}</div>
          <YearBoxes getFn={getCount} />
        </div>

        <div className="kpi-card kpi-card-green">
          <div className="kpi-card-label">✓ Të Përfunduara (viti vlerësimit)</div>
          <div className="kpi-card-value">{completed.length}</div>
          <div className="kpi-card-sub">{rows.length>0?(completed.length/rows.length*100).toFixed(1):0}% e totalit</div>
          <YearBoxes getFn={getCompleted} />
        </div>

        <div className="kpi-card kpi-card-red">
          <div className="kpi-card-label">✗ Të Anulluara (viti vlerësimit)</div>
          <div className="kpi-card-value">{annulled.length}</div>
          <div className="kpi-card-sub">{annulledPct}% · {formatMlnEur(annulledFondi)} mln €</div>
          <YearBoxesAnn />
        </div>

        <div className="kpi-card kpi-card-blue">
          <div className="kpi-card-label">Fondi i Prokuruar — gjithsej (viti shpalljes)</div>
          <div className="kpi-card-value">{formatMlnEur(grandFondiAll)} mln €</div>
          <div className="kpi-card-sub">{formatNum(grandFondiAll)} Lekë</div>
          <YearBoxesFondi getFn={getFondiProk} />
        </div>

        <div className="kpi-card kpi-card-green">
          <div className="kpi-card-label">Fondi i Vlerësuar ✓ (viti vlerësimit)</div>
          <div className="kpi-card-value">{formatMlnEur(grandFondiComp)} mln €</div>
          <div className="kpi-card-sub">{formatNum(grandFondiComp)} Lekë</div>
          <YearBoxesFondi getFn={getFondiVler} />
        </div>

        <div className="kpi-card kpi-card-green">
          <div className="kpi-card-label">Kursimi Total ✓ (viti vlerësimit)</div>
          <div className="kpi-card-value">{formatMlnEur(grandKursimi)} mln €</div>
          <div className="kpi-card-sub">Mesatare: {avgPct.toFixed(2)}%</div>
          <YearBoxesFondi getFn={getKursimi} />
        </div>

      </div>
    </div>
  );
}

function BarPage({ title, data, color, fmt, label, domain, isLast }) {
  return (
    <div className="print-page" style={isLast ? { pageBreakAfter:'avoid', breakAfter:'avoid' } : {}}>
      <h2>{title}</h2>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top:16, right:16, left:0, bottom:48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
            <XAxis
              dataKey="label"
              tick={{ fontSize:11, fill:'#222', fontWeight:600 }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fontSize:12, fill:'#222', fontWeight:600 }}
              domain={domain}
              width={50}
            />
            <Tooltip contentStyle={TT} labelStyle={TT_L} itemStyle={TT_I}
              formatter={v=>[fmt(v),label]} />
            <Bar dataKey="value" radius={[4,4,0,0]}>
              {data.map((e,i) => <Cell key={i} fill={e.isObp ? color : HIST} />)}
              <LabelList dataKey="value" position="top"
                formatter={v => fmt(v)}
                style={{ fontSize:11, fill:'#111', fontWeight:700 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="legend">
        <span className="dot" style={{ background:HIST }} />
        2019–2024 (Para OBP)
        &nbsp;&nbsp;&nbsp;
        <span className="dot" style={{ background:color }} />
        OBP (2024–2026)
      </div>
    </div>
  );
}

export default function PrintPage({ rows }) {
  const completed = rows.filter(r =>  r.ePerfunduar && !r.eAnulluar);
  const annulled  = rows.filter(r =>  r.eAnulluar);
  const active    = rows.filter(r => !r.ePerfunduar && !r.eAnulluar);
  // liveYears: only years not in HISTORY (for bar charts)
  const liveYears  = uniqueYears(rows)
    .filter(y => !HISTORY_YEARS.has(String(y)) && String(y) !== '2024' && String(y) !== '2025');
  // kpiYears: only 2024, 2025 (HISTORY) + live years (2026+)
  const kpiYears   = ['OBP 8M 2024', '2025', ...liveYears];
  const years = liveYears; // keep 'years' for chart compat

  const fondiProkByYear = {};
  years.forEach(y => {
    fondiProkByYear[y] = grandTotal(rows.filter(r => (r.vitiShpalljes||r.year)===y), 'fondiLimit');
  });
  const totKurs      = totalsByYear(completed, 'kursimi',    'vitiVleresimit');
  const totFondiVler = totalsByYear(completed, 'fondiLimit', 'vitiVleresimit');

  const liveByYear = years.map(y => {
    const yShp  = rows.filter(r => (r.vitiShpalljes||r.year)===y);
    const yAnn  = annulled.filter(r => (r.vitiVleresimit||r.year)===y);
    const yComp = completed.filter(r => (r.vitiVleresimit||r.year)===y);
    const fondiP = fondiProkByYear[y]||0;
    const kurs   = totKurs[y]||0;
    const fondiV = totFondiVler[y]||0;
    const avgOf  = yComp.length>0 ? yComp.reduce((s,r)=>s+Number(r.nrOfertave||0),0)/yComp.length : 0;
    const avgOe  = yComp.length>0 ? yComp.reduce((s,r)=>s+Number(r.nrOperatoreve||0),0)/yComp.length : 0;
    const sukses = yShp.length - yAnn.length;
    const mSet   = new Set();
    yShp.forEach(r => { if(r.dataShpalljes){const p=r.dataShpalljes.split('/');if(p.length===3)mSet.add(Number(p[1]));} }); // DD/MM/YYYY → month is index 1
    const nM = mSet.size>0 ? Math.max(...mSet) : 12;
    const avgKPct = yComp.length>0 ? yComp.reduce((s,r)=>s+(Number(r.kursimiPct)||0),0)/yComp.length : 0;
    return {
      label: String(y), isObp:true,
      procedures:     yShp.length,
      annulled:       yAnn.length,
      completed:      yComp.length,
      fondiMlnEur:    parseFloat(formatMlnEur(fondiP)),
      fondiVlerMlnEur:parseFloat(formatMlnEur(fondiV)),
      kursimiMlnEur:  parseFloat(formatMlnEur(kurs)),
      ofertave:       parseFloat(avgOf.toFixed(1)),
      operatoreve:    parseFloat(avgOe.toFixed(1)),
      sukses,
      suksesPct:      yShp.length>0?parseFloat((sukses/yShp.length*100).toFixed(1)):0,
      annulledPct:    yShp.length>0?parseFloat((yAnn.length/yShp.length*100).toFixed(1)):0,
      kursimiVlerPct: fondiV>0?parseFloat((kurs/fondiV*100).toFixed(2)):0,
      avgKursimiPct:  parseFloat(avgKPct.toFixed(2)),
      procPerMonth:   parseFloat((yShp.length/nM).toFixed(1)),
      fondiPerMonth:  parseFloat((fondiP/nM/100_000_000).toFixed(2)),
    };
  });

  const completedByYear = {}, annulledByYear = {}, annulledFondiByYear = {}, fondiVlerByYear = {};
  years.forEach(y => {
    completedByYear[y]     = completed.filter(r => (r.vitiVleresimit||r.year)===y).length;
    annulledByYear[y]      = annulled.filter(r  => (r.vitiVleresimit||r.year)===y).length;
    annulledFondiByYear[y] = grandTotal(annulled.filter(r => (r.vitiVleresimit||r.year)===y), 'fondiLimit');
    fondiVlerByYear[y]     = totFondiVler[y]||0;
  });

  const charts = [
    { title:'Numri i Procedurave (viti shpalljes)',                              field:'procedures',     color:BLUE,   fmt:v=>`${v}`,       label:'Procedura' },
    { title:'Fonde të Prokuruara (mln €) — viti shpalljes',                     field:'fondiMlnEur',    color:BLUE,   fmt:v=>`${v} mln €`, label:'Fondi' },
    { title:'Kursimet (mln €) — vetëm ✓ të përfunduarat',                       field:'kursimiMlnEur',  color:GREEN,  fmt:v=>`${v} mln €`, label:'Kursimi' },
    { title:'Numri Mesatar i Ofertave — vetëm ✓ të përfunduarat',               field:'ofertave',       color:AMBER,  fmt:v=>`${v}`,       label:'Oferta', domain:[0,8] },
    { title:'Numri Mesatar i Operatorëve Ekonomikë',                             field:'operatoreve',    color:PURPLE, fmt:v=>`${v}`,       label:'OE' },
    { title:'Procedura të Suksesshme (Nr.) = Gjithsej − Anullime',              field:'sukses',         color:GREEN,  fmt:v=>`${v}`,       label:'Sukses' },
    { title:'Procedura të Suksesshme (%) = (Gjithsej − Anullime) / Gjithsej',  field:'suksesPct',      color:GREEN,  fmt:v=>`${v}%`,      label:'Sukses %' },
    { title:'Procedura të Anulluara (%) — viti vlerësimit',                     field:'annulledPct',    color:RED,    fmt:v=>`${v}%`,      label:'Anullime %' },
    { title:'Nr. Mesatar i Procedurave në Muaj',                                field:'procPerMonth',   color:AMBER,  fmt:v=>`${v}`,       label:'Proc/muaj' },
    { title:'Fondi Mesatar në Muaj (mln €)',                                    field:'fondiPerMonth',  color:BLUE,   fmt:v=>`${v} mln €`, label:'Fond/muaj' },
    { title:'Procedurat e Finalizuara — Fondi i Vlerësuar (mln €)',             field:'fondiVlerMlnEur',color:GREEN,  fmt:v=>`${v} mln €`, label:'Fondi Vlerësuar' },
    { title:'Kursimi / Fondi i Vlerësuar (%)',                                  field:'kursimiVlerPct', color:GREEN,  fmt:v=>`${v}%`,      label:'Kursimi %' },
    { title:'Mesatarja në % e Kursimit të Procedurave ✓',                       field:'avgKursimiPct',  color:CYAN,   fmt:v=>`${v}%`,      label:'Mesatare %' },
    { title:'Numri i Procedurave të Prokurimit të FINALIZUARA',                 field:'completed',      color:GREEN,  fmt:v=>`${v}`,       label:'Të Finalizuara' },
  ];

  const statusPie = [
    { name:'Në proces',      value: active.length    },
    { name:'Të përfunduara', value: completed.length },
    { name:'Të anulluara',   value: annulled.length  },
  ].filter(d=>d.value>0);

  return (
    <>
      <style>{CSS}</style>
      <button className="print-btn" onClick={() => window.print()}>
        🖨️ Printo / Ruaj si PDF
      </button>

      <KpiPage
        rows={rows}
        completed={completed}
        annulled={annulled}
        years={kpiYears}
        fondiProkByYear={fondiProkByYear}
        totKurs={totKurs}
        totFondiVler={totFondiVler}
        completedByYear={completedByYear}
        annulledByYear={annulledByYear}
        annulledFondiByYear={annulledFondiByYear}
        fondiVlerByYear={fondiVlerByYear}
        historyData={HISTORY}
        liveYears={liveYears}
      />

      {charts.map((c,i) => (
        <BarPage
          key={i}
          title={c.title}
          data={mergedData(liveByYear, c.field)}
          color={c.color}
          fmt={c.fmt}
          label={c.label}
          domain={c.domain}
          isLast={i === charts.length - 1 && statusPie.length === 0}
        />
      ))}

      {statusPie.length > 0 && (
        <div className="print-page" style={{ pageBreakAfter:'avoid', breakAfter:'avoid' }}>
          <h2>Statusi i Procedurave</h2>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name"
                  cx="50%" cy="48%" outerRadius={130}
                  label={({name,percent,x,y,cx})=>(
                    <text x={x} y={y} fill="#000" fontSize={12} fontWeight="600"
                      textAnchor={x>cx?'start':'end'} dominantBaseline="central">
                      {name}: {(percent*100).toFixed(0)}%
                    </text>
                  )}
                  labelLine={{ stroke:'#666' }}>
                  {statusPie.map((_,i)=><Cell key={i} fill={[AMBER,GREEN,RED][i]} />)}
                </Pie>
                <Tooltip contentStyle={TT} formatter={(v,n,p)=>[`${v} procedura`,p.payload.name]} />
                <Legend wrapperStyle={{ fontSize:12, color:'#000' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
}
