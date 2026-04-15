import * as XLSX from 'xlsx';

export const COLUMNS = [
  { key: 'nr',            label: 'Nr.'                      },
  { key: 'description',   label: 'Objektet'                 },
  { key: 'ref',           label: 'Nr. Ref'                  },
  { key: 'fondiLimit',    label: 'Fondi Limit (Leke)'       },
  { key: 'vleraFituesit', label: 'Vlera e Fituesit (Leke)'  },
  { key: 'nePct',         label: 'Ne % (vlera/fondi)'       },
  { key: 'kursimi',       label: 'Kursimi (Leke)'           },
  { key: 'kursimiPct',    label: 'Kursimi %'                },
  { key: 'lloji',         label: 'Lloji'                    },
  { key: 'nrOfertave',    label: 'Nr. Ofertave'             },
  { key: 'nrOperatoreve', label: 'Nr. Operatoreve'          },
  { key: 'dataShpalljes', label: 'Data Shpalljes'           },
  { key: 'dataHapjes',    label: 'Data Hapjes'              },
  { key: 'vitiShpalljes', label: 'Viti Shpalljes'           },
  { key: 'vitiVleresimit',label: 'Viti Vleresimit'          },
  { key: 'ePerfunduar',   label: 'E Perfunduar (1=po)'      },
  { key: 'eAnulluar',     label: 'E Anulluar (1=po)'        },
  { key: 'notes',         label: 'Shenime'                  },
  { key: 'editedBy',      label: 'Redaktuar nga'            },
  { key: 'lastEditedAt',  label: 'Redaktuar me'             },
];

const ALIASES = {
  'nr': 'nr', 'nr.': 'nr',
  'viti': 'year', 'year': 'year',
  'objektet': 'description', 'description': 'description', 'objekt': 'description',
  'nr. ref': 'ref', 'nr ref': 'ref', 'ref': 'ref', 'nr.ref': 'ref',
  'fondi limit (leke)': 'fondiLimit', 'fondi limit (lekë)': 'fondiLimit', 'fondi limit': 'fondiLimit', 'fond limit': 'fondiLimit',
  'vlera e fituesit (leke)': 'vleraFituesit', 'vlera e fituesit (lekë)': 'vleraFituesit', 'vlera e fituesit': 'vleraFituesit', 'vlera fituesit': 'vleraFituesit',
  'ne % (vlera/fondi)': 'nePct', 'ne %': 'nePct', 'ne%': 'nePct',
  'kursimi (leke)': 'kursimi', 'kursimi (lekë)': 'kursimi', 'kursimi ne leke': 'kursimi', 'kursimi': 'kursimi',
  'kursimi per procedure ne leke': 'kursimi',
  'kursimi %': 'kursimiPct', 'kursimi ne %': 'kursimiPct', 'kursimi ne % per procedure': 'kursimiPct',
  'vlera e fituesit/fondit limit': 'nePct',
  'lloji': 'lloji', 'lloji i procedures': 'lloji', 'lloji i procedurës': 'lloji',
  'nr. ofertave': 'nrOfertave', 'nr ofertave': 'nrOfertave', 'nr. i ofertave': 'nrOfertave', 'nr i ofertave': 'nrOfertave', 'numri i ofertave': 'nrOfertave',
  'nr. operatoreve': 'nrOperatoreve', 'nr operatoreve': 'nrOperatoreve', 'nr i operatoreve ekonomik': 'nrOperatoreve', 'nr. i operatoreve': 'nrOperatoreve', 'nr i operatoreve': 'nrOperatoreve',
  'data shpalljes': 'dataShpalljes', 'data e shpalljes': 'dataShpalljes', 'dt. shpalljes': 'dataShpalljes',
  'data hapjes': 'dataHapjes', 'data e hapjes se ofertave': 'dataHapjes', 'dt. hapjes': 'dataHapjes',
  'viti shpalljes': 'vitiShpalljes', 'viti i shpalljes': 'vitiShpalljes',
  'viti vleresimit': 'vitiVleresimit', 'viti i vleresimit': 'vitiVleresimit', 'viti i vlersimit': 'vitiVleresimit',
  'e perfunduar (1=po)': 'ePerfunduar', 'e perfunduar': 'ePerfunduar', 'perfunduar': 'ePerfunduar',
  'e anulluar (1=po)': 'eAnulluar', 'e anulluar': 'eAnulluar', 'anulluar': 'eAnulluar',
  'redaktuar nga': 'editedBy', 'redaktuar me': 'lastEditedAt', 'redaktuar më': 'lastEditedAt',
};

function toDateString(val) {
  if (!val && val !== 0) return '';
  try {
    if (typeof val === 'number') { const j = XLSX.SSF.parse_date_code(val); if (j) return `${String(j.m).padStart(2,'0')}/${String(j.d).padStart(2,'0')}/${j.y}`; }
    if (val instanceof Date) { return `${String(val.getMonth()+1).padStart(2,'0')}/${String(val.getDate()).padStart(2,'0')}/${val.getFullYear()}`; }
    const str = String(val).trim(); if (!str || str === 'NaN') return '';
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) return str;
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[2]}/${m[3]}/${m[1]}`;
    const d = new Date(str); if (!isNaN(d.getTime())) return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
    return str;
  } catch { return String(val || ''); }
}
function toYear(val) { if (!val) return new Date().getFullYear(); const s = toDateString(val); const p = s.split('/'); return p.length===3 ? (parseInt(p[2])||new Date().getFullYear()) : new Date().getFullYear(); }
function toNum(val) { if (typeof val === 'number') return val; return parseFloat(String(val||0).replace(/[^0-9.\-]/g,''))||0; }
function toBool(val) { if (typeof val === 'boolean') return val; if (typeof val === 'number') return val===1; const s = String(val).toLowerCase().trim(); return s==='1'||s==='true'||s==='po'||s==='yes'; }

export function exportToExcel(rows, filename = 'OBP_Savings') {
  const data = rows.map(row => { const obj = {}; for (const col of COLUMNS) { let val = row[col.key]; if (col.key==='ePerfunduar'||col.key==='eAnulluar') val = val?1:0; obj[col.label] = val ?? ''; } return obj; });
  const completed = rows.filter(r => r.ePerfunduar && !r.eAnulluar);
  const tf = rows.reduce((s,r) => s+toNum(r.fondiLimit),0);
  const tk = completed.reduce((s,r) => s+toNum(r.kursimi),0);
  data.push({});
  data.push({ 'Nr.':'TOTAL', 'Fondi Limit (Leke)':tf, 'Kursimi (Leke)':tk, 'Kursimi %': tf>0?(tk/tf*100).toFixed(2)+'%':'0%' });
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = COLUMNS.map(c => ({ wch: c.key==='description'?60:c.key==='ref'?28:18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Savings');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0,10)}.xlsx`);
}

export function importFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type:'array', cellDates:true, dateNF:'mm/dd/yyyy' });
        const sheetName = wb.SheetNames.find(n => n.toUpperCase().includes('SAVING')||n.toUpperCase().includes('KURSIM')) || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_json(ws, { defval:'', raw:false });
        const rawNum = XLSX.utils.sheet_to_json(ws, { defval:'', raw:true });
        if (raw.length===0) return resolve({ rows:[], errors:['Fleta është bosh.'] });
        const rows = [], errors = [];
        raw.forEach((rawRow, rowIdx) => {
          const norm = {};
          Object.entries(rawRow).forEach(([k, v]) => {
            const cleanKey = k.toLowerCase().trim().replace(/\s+/g,' ').replace(/ë/g,'e').replace(/ç/g,'c');
            const alias = ALIASES[cleanKey] || ALIASES[k.toLowerCase().trim()];
            if (alias) { norm[alias] = v; if ((alias==='dataShpalljes'||alias==='dataHapjes') && rawNum[rowIdx]) norm[alias+'_raw'] = rawNum[rowIdx][k]; }
          });
          if (!norm.description && !norm.fondiLimit) return;
          if (String(norm.description).toUpperCase()==='TOTAL') return;
          if (String(norm.nr).toUpperCase()==='TOTAL') return;
          const fondi = toNum(norm.fondiLimit), vlera = toNum(norm.vleraFituesit);
          const kursimi = fondi-vlera;
          const nePct = fondi>0?parseFloat((vlera/fondi*100).toFixed(2)):0;
          const kursimiPct = fondi>0?parseFloat((kursimi/fondi*100).toFixed(2)):0;
          const dsRaw = norm.dataShpalljes_raw ?? norm.dataShpalljes;
          const dhRaw = norm.dataHapjes_raw ?? norm.dataHapjes;
          const dataShpalljes = toDateString(dsRaw), dataHapjes = toDateString(dhRaw);
          const vitiShpalljes = parseInt(norm.vitiShpalljes) || parseInt(norm.year) || (dataShpalljes ? toYear(dsRaw) : new Date().getFullYear());
          const year = vitiShpalljes;
          const vitiVleresimit = parseInt(norm.vitiVleresimit) || vitiShpalljes;
          rows.push({
            id: crypto.randomUUID(), nr: Number(norm.nr)||null, year, vitiShpalljes, vitiVleresimit,
            description: String(norm.description||''), ref: String(norm.ref||''),
            fondiLimit: fondi, vleraFituesit: vlera, nePct, kursimi, kursimiPct,
            lloji: String(norm.lloji||''), nrOfertave: toNum(norm.nrOfertave), nrOperatoreve: toNum(norm.nrOperatoreve),
            dataShpalljes, dataHapjes, ePerfunduar: toBool(norm.ePerfunduar), eAnulluar: toBool(norm.eAnulluar),
            lastEditedAt: null, editedBy: null,
          });
        });
        if (rows.length===0) errors.push('Nuk u njoh asnjë kolonë.');
        resolve({ rows, errors });
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
