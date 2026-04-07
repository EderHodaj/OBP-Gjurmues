// utils/excelIO.js — Excel import & export using SheetJS
import * as XLSX from 'xlsx';

// ── Column map: internal key → Albanian header used in the exported file ──
// This is the SINGLE source of truth. Import reads these same headers back.
export const COLUMNS = [
  { key: 'nr',            label: 'Nr.'                      },
  { key: 'year',          label: 'Viti'                     },
  { key: 'description',   label: 'Objektet'                 },
  { key: 'ref',           label: 'Nr. Ref'                  },
  { key: 'fondiLimit',    label: 'Fondi Limit (Leke)'       },
  { key: 'vleraFituesit', label: 'Vlera e Fituesit (Leke)'  },
  { key: 'nePct',         label: 'Ne % (vlera/fondi)'       },
  { key: 'kursimi',       label: 'Kursimi (Leke)'           },
  { key: 'kursimiPct',    label: 'Kursimi %'                },
  { key: 'lloji',         label: 'Lloji'                    },
  { key: 'nrOfertave',    label: 'Nr. Ofertave'             },
  { key: 'dataShpalljes', label: 'Data Shpalljes'           },
  { key: 'dataHapjes',    label: 'Data Hapjes'              },
  { key: 'ePerfunduar',   label: 'E Perfunduar (1=po)'      },
  { key: 'eAnulluar',     label: 'E Anulluar (1=po)'        },
  { key: 'editedBy',      label: 'Redaktuar nga'            },
  { key: 'lastEditedAt',  label: 'Redaktuar me'             },
];

// ── Aliases for IMPORT — every possible header variation → internal key ──
// Handles: exported files, original Excel files, and hand-typed headers
const ALIASES = {
  // Nr
  'nr':                        'nr',
  'nr.':                       'nr',

  // Year
  'viti':                      'year',
  'year':                      'year',

  // Description
  'objektet':                  'description',
  'description':               'description',
  'objekt':                    'description',

  // Ref
  'nr. ref':                   'ref',
  'nr ref':                    'ref',
  'ref':                       'ref',
  'nr.ref':                    'ref',

  // Fondi Limit — all variations from original Excel + exported file
  'fondi limit (leke)':        'fondiLimit',
  'fondi limit (lekë)':        'fondiLimit',
  'fondi limit':               'fondiLimit',
  'fond limit':                'fondiLimit',

  // Vlera Fituesit
  'vlera e fituesit (leke)':   'vleraFituesit',
  'vlera e fituesit (lekë)':   'vleraFituesit',
  'vlera e fituesit':          'vleraFituesit',
  'vlera fituesit':            'vleraFituesit',

  // Ne % (ratio used/budget)
  'ne % (vlera/fondi)':        'nePct',
  'ne %':                      'nePct',
  'ne%':                       'nePct',
  'ne % (vlera/fondit)':       'nePct',

  // Kursimi
  'kursimi (leke)':            'kursimi',
  'kursimi (lekë)':            'kursimi',
  'kursimi ne leke':           'kursimi',
  'kursimi ne lekë':           'kursimi',
  'kursimi':                   'kursimi',
  'kursimi ne % per procedure':'kursimi',

  // Kursimi %
  'kursimi %':                 'kursimiPct',
  'kursimi ne %':              'kursimiPct',
  'kursimi%':                  'kursimiPct',
  'kursimi ne % per procedurë':'kursimiPct',

  // Lloji
  'lloji':                     'lloji',
  'lloji i procedures':        'lloji',
  'lloji i procedurës':        'lloji',
  'lloji i procedurës':        'lloji',

  // Nr Ofertave
  'nr. ofertave':              'nrOfertave',
  'nr ofertave':               'nrOfertave',
  'nr. i ofertave':            'nrOfertave',
  'nr i ofertave':             'nrOfertave',
  'numri i ofertave':          'nrOfertave',
  'nr i operatoreve ekonomik': 'nrOfertave',

  // Dates
  'data shpalljes':            'dataShpalljes',
  'data e shpalljes':          'dataShpalljes',
  'dt. shpalljes':             'dataShpalljes',

  'data hapjes':               'dataHapjes',
  'data e hapjes se ofertave': 'dataHapjes',
  'dt. hapjes':                'dataHapjes',

  // Status flags
  'e perfunduar (1=po)':       'ePerfunduar',
  'e perfunduar':              'ePerfunduar',
  'perfunduar':                'ePerfunduar',

  'e anulluar (1=po)':         'eAnulluar',
  'e anulluar':                'eAnulluar',
  'anulluar':                  'eAnulluar',

  // Metadata
  'redaktuar nga':             'editedBy',
  'redaktuar me':              'lastEditedAt',
  'redaktuar më':              'lastEditedAt',
};

// ── Date helpers ─────────────────────────────────────────────

/**
 * Convert ANY date value from Excel to MM/DD/YYYY string.
 * Excel dates can come as:
 *   - A number (serial date, e.g. 45972)
 *   - A JS Date object
 *   - A string like "2025-11-17 00:00:00", "11/17/2025", "2025-11-17"
 */
function toDateString(val) {
  if (!val && val !== 0) return '';
  try {
    // If it's a number → Excel serial date
    if (typeof val === 'number') {
      const jsDate = XLSX.SSF.parse_date_code(val);
      if (jsDate) {
        const m = String(jsDate.m).padStart(2, '0');
        const d = String(jsDate.d).padStart(2, '0');
        return `${m}/${d}/${jsDate.y}`;
      }
    }
    // If it's already a Date object
    if (val instanceof Date) {
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${m}/${d}/${val.getFullYear()}`;
    }
    // String: try to parse
    const str = String(val).trim();
    if (!str || str === 'NaN') return '';

    // Already in MM/DD/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) return str;

    // YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;

    // Fallback: let Date parse it
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${m}/${day}/${d.getFullYear()}`;
    }
    return str;
  } catch {
    return String(val || '');
  }
}

/**
 * Extract year (number) from a date value.
 */
function toYear(val) {
  if (!val) return new Date().getFullYear();
  const str = toDateString(val);
  if (!str) return new Date().getFullYear();
  // MM/DD/YYYY → last part
  const parts = str.split('/');
  if (parts.length === 3) return parseInt(parts[2]) || new Date().getFullYear();
  return new Date().getFullYear();
}

// ── Number helper ─────────────────────────────────────────────
function toNum(val) {
  if (typeof val === 'number') return val;
  return parseFloat(String(val || 0).replace(/[^0-9.\-]/g, '')) || 0;
}

// ── Boolean helper (handles 1/0, TRUE/FALSE, "po"/"jo") ──────
function toBool(val) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number')  return val === 1;
  const s = String(val).toLowerCase().trim();
  return s === '1' || s === 'true' || s === 'po' || s === 'yes';
}

// ═══════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════
export function exportToExcel(rows, filename = 'OBP_Savings') {
  const data = rows.map(row => {
    const obj = {};
    for (const col of COLUMNS) {
      let val = row[col.key];
      if (col.key === 'ePerfunduar' || col.key === 'eAnulluar') val = val ? 1 : 0;
      obj[col.label] = val ?? '';
    }
    return obj;
  });

  // Summary totals row
  const completed = rows.filter(r => r.ePerfunduar && !r.eAnulluar);
  const annulled  = rows.filter(r => r.eAnulluar);
  const tf = rows.reduce((s,r) => s + toNum(r.fondiLimit), 0);
  const tv = rows.reduce((s,r) => s + toNum(r.vleraFituesit), 0);
  const tk = completed.reduce((s,r) => s + toNum(r.kursimi), 0);

  data.push({});
  data.push({
    'Nr.':                    'TOTAL',
    'Fondi Limit (Leke)':     tf,
    'Vlera e Fituesit (Leke)':tv,
    'Kursimi (Leke)':         tk,
    'Kursimi %':              tf > 0 ? (tk/tf*100).toFixed(2)+'%' : '0%',
  });
  data.push({
    'Nr.':       'INFO',
    'Objektet':  `Procedura gjithsej: ${rows.length} | Të përfunduara: ${completed.length} | Të anulluara: ${annulled.length} (${rows.length>0?(annulled.length/rows.length*100).toFixed(1):0}%)`,
  });

  const ws = XLSX.utils.json_to_sheet(data);

  // Column widths
  const widths = {
    'Nr.': 6, 'Viti': 8, 'Objektet': 60, 'Nr. Ref': 28,
    'Fondi Limit (Leke)': 22, 'Vlera e Fituesit (Leke)': 24,
    'Ne % (vlera/fondi)': 18, 'Kursimi (Leke)': 20, 'Kursimi %': 12,
    'Lloji': 8, 'Nr. Ofertave': 14,
    'Data Shpalljes': 16, 'Data Hapjes': 14,
    'E Perfunduar (1=po)': 18, 'E Anulluar (1=po)': 16,
    'Redaktuar nga': 20, 'Redaktuar me': 22,
  };
  ws['!cols'] = COLUMNS.map(c => ({ wch: widths[c.label] || 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Savings');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ═══════════════════════════════════════════════════════════
// IMPORT
// ═══════════════════════════════════════════════════════════
export function importFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), {
          type: 'array',
          cellDates: true,   // ← converts serial date numbers to JS Date objects
          dateNF:   'mm/dd/yyyy',
        });

        // Prefer "SAVINGS" or "KURSIM" sheet, otherwise first sheet
        const sheetName = wb.SheetNames.find(n =>
          n.toUpperCase().includes('SAVING') ||
          n.toUpperCase().includes('KURSIM')
        ) || wb.SheetNames[0];

        const ws  = wb.Sheets[sheetName];

        // raw: array of objects where keys = first-row headers
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
        // rawNum: same but with raw numbers (for serial dates we missed)
        const rawNum = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });

        if (raw.length === 0) return resolve({ rows: [], errors: ['Fleta është bosh.'] });

        const rows = [];
        const errors = [];

        raw.forEach((rawRow, rowIdx) => {
          // Normalise every key to lowercase, trimmed, then look up alias
          const norm = {};
          Object.entries(rawRow).forEach(([k, v]) => {
            // Clean up key: remove special chars, lowercase
            const cleanKey = k.toLowerCase().trim()
              .replace(/\s+/g,' ')
              .replace(/ë/g,'e').replace(/ç/g,'c');
            const alias = ALIASES[cleanKey] || ALIASES[k.toLowerCase().trim()];
            if (alias) {
              norm[alias] = v;
              // Also store raw numeric value for date fields
              if ((alias === 'dataShpalljes' || alias === 'dataHapjes') && rawNum[rowIdx]) {
                norm[alias + '_raw'] = rawNum[rowIdx][k];
              }
            }
          });

          // Skip blank / summary rows
          if (!norm.description && !norm.fondiLimit) return;
          if (String(norm.description).toUpperCase() === 'TOTAL') return;
          if (String(norm.nr).toUpperCase() === 'TOTAL') return;

          const fondi  = toNum(norm.fondiLimit);
          const vlera  = toNum(norm.vleraFituesit);
          const kursimi    = fondi - vlera;
          const nePct      = fondi > 0 ? parseFloat((vlera  / fondi * 100).toFixed(2)) : 0;
          const kursimiPct = fondi > 0 ? parseFloat((kursimi / fondi * 100).toFixed(2)) : 0;

          // Date: prefer the _raw variant (handles serial numbers), fall back to string
          const dsRaw = norm.dataShpalljes_raw ?? norm.dataShpalljes;
          const dhRaw = norm.dataHapjes_raw    ?? norm.dataHapjes;
          const dataShpalljes = toDateString(dsRaw);
          const dataHapjes    = toDateString(dhRaw);

          // Year: extract from Data Shpalljes; fall back to Viti column
          const year = parseInt(norm.year)
              || (dataShpalljes ? toYear(dsRaw) : new Date().getFullYear());

          rows.push({
            id:            crypto.randomUUID(),
            nr:            Number(norm.nr) || null,
            year,
            description:   String(norm.description || ''),
            ref:           String(norm.ref || ''),
            fondiLimit:    fondi,
            vleraFituesit: vlera,
            nePct,
            kursimi,
            kursimiPct,
            lloji:         String(norm.lloji || ''),
            nrOfertave:    toNum(norm.nrOfertave),
            dataShpalljes,
            dataHapjes,
            ePerfunduar:   toBool(norm.ePerfunduar),
            eAnulluar:     toBool(norm.eAnulluar),
            lastEditedAt:  null,
            editedBy:      null,
          });
        });

        if (rows.length === 0) {
          errors.push('Nuk u njoh asnjë kolonë. Shiko udhëzimet e formatit.');
        }

        resolve({ rows, errors });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
