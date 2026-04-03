import SEED_DATA from '../data/seedData.js';

const KEY = 'obp_rows_v5';
const USER_KEY = 'obp_username';

function migrate(r) {
  const base = { dataHapjes: '', nePct: 0, eAnulluar: false, ...r };
  // Vendos true VETËM nëse nuk ka vlerë të vendosur tashmë
  if (base.ePerfunduar === undefined || base.ePerfunduar === null) {
    base.ePerfunduar = true;
  }
  return base;
}

export function loadRows() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw).map(migrate);
    return SEED_DATA.map(r => migrate({ ...r }));
  } catch {
    return SEED_DATA.map(r => migrate({ ...r }));
  }
}

export function saveRows(rows) { localStorage.setItem(KEY, JSON.stringify(rows)); }
export function loadUsername()  { return localStorage.getItem(USER_KEY) || ''; }
export function saveUsername(n) { localStorage.setItem(USER_KEY, n); }

export function resetToSeed() {
  localStorage.removeItem(KEY);
  return SEED_DATA.map(r => migrate({ ...r }));
}

export function createBlankRow(year = 2026) {
  return {
    id: crypto.randomUUID(), nr: null, year,
    description: '', ref: '',
    fondiLimit: 0, vleraFituesit: 0, nePct: 0, kursimi: 0, kursimiPct: 0,
    lloji: 'M', nrOfertave: 1,
    dataShpalljes: '', dataHapjes: '',
    ePerfunduar: false, eAnulluar: false,
    lastEditedAt: null, editedBy: null,
  };
}
