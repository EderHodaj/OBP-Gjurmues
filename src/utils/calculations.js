export function totalsByYear(rows, field = 'fondiLimit', yearField = 'vitiVleresimit') {
  return rows.reduce((acc, r) => {
    const y = Number(r[yearField] || r.year);
    if (!isNaN(y)) acc[y] = (acc[y] || 0) + Number(r[field] || 0);
    return acc;
  }, {});
}

export function uniqueYears(rows) {
  const ySet = new Set();
  rows.forEach(r => {
    const y1 = Number(r.vitiShpalljes || r.year);
    const y2 = Number(r.vitiVleresimit || r.year);
    if (!isNaN(y1)) ySet.add(y1);
    if (!isNaN(y2)) ySet.add(y2);
  });
  return [...ySet].sort((a,b) => a-b);
}

export function grandTotal(rows, field = 'fondiLimit') {
  return rows.reduce((s, r) => s + Number(r[field] || 0), 0);
}

export function formatNum(n, dec = 0) {
  return Number(n || 0).toLocaleString('sq-AL', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function formatMlnEur(leke) {
  return (Number(leke || 0) / 100_000_000).toFixed(2);
}

export function formatTimestamp(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('sq-AL', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function recalcRow(row) {
  const fondi  = Number(row.fondiLimit)    || 0;
  const vlera  = Number(row.vleraFituesit) || 0;
  const kursimi    = fondi - vlera;
  const nePct      = fondi > 0 ? parseFloat((vlera  / fondi * 100).toFixed(2)) : 0;
  const kursimiPct = fondi > 0 ? parseFloat((kursimi / fondi * 100).toFixed(2)) : 0;
  return { ...row, kursimi, nePct, kursimiPct };
}
