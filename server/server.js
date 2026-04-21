// ============================================================
// OBP Savings Tracker — LAN Server
// Node.js + Express + sqlite3 (async, no compilation needed)
// ============================================================

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app    = express();
const PORT   = 3001;
const SECRET = 'obp-lan-secret-2025';

// ── Database setup ────────────────────────────────────────────
const DB_PATH = path.join(__dirname, 'db.sqlite');
const db      = new sqlite3.Database(DB_PATH, (err) => {
  if (err) { console.error('DB open error:', err); process.exit(1); }
  console.log('Database opened:', DB_PATH);
});

// Promisify helpers
function dbRun(sql, params = []) {
  return new Promise((res, rej) =>
    db.run(sql, params, function(err) { err ? rej(err) : res(this); })
  );
}
function dbGet(sql, params = []) {
  return new Promise((res, rej) =>
    db.get(sql, params, (err, row) => err ? rej(err) : res(row))
  );
}
function dbAll(sql, params = []) {
  return new Promise((res, rej) =>
    db.all(sql, params, (err, rows) => err ? rej(err) : res(rows))
  );
}
function dbExec(sql) {
  return new Promise((res, rej) => db.exec(sql, err => err ? rej(err) : res()));
}

// ── Create tables ─────────────────────────────────────────────
async function initDB() {
  await dbExec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      password   TEXT    NOT NULL,
      role       TEXT    NOT NULL DEFAULT 'viewer',
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS procedures (
      id              TEXT PRIMARY KEY,
      nr              INTEGER,
      year            INTEGER,
      viti_shpalljes  INTEGER,
      viti_vleresimit INTEGER,
      description     TEXT,
      ref             TEXT,
      fondi_limit     REAL DEFAULT 0,
      vlera_fituesit  REAL DEFAULT 0,
      ne_pct          REAL DEFAULT 0,
      kursimi         REAL DEFAULT 0,
      kursimi_pct     REAL DEFAULT 0,
      lloji           TEXT,
      nr_ofertave     INTEGER DEFAULT 0,
      nr_operatoreve  INTEGER DEFAULT 0,
      data_shpalljes  TEXT,
      data_hapjes     TEXT,
      e_perfunduar    INTEGER DEFAULT 1,
      e_anulluar      INTEGER DEFAULT 0,
      notes           TEXT DEFAULT '',
      last_edited_at  TEXT,
      edited_by       TEXT,
      updated_at      TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed if empty
  const row = await dbGet('SELECT COUNT(*) as c FROM procedures');
  if (row.c === 0) {
    console.log('Empty database — loading seed data...');
    try {
      const seedPath = path.join(__dirname, '..', 'src', 'data', 'seedData.js');
      if (fs.existsSync(seedPath)) {
        const raw   = fs.readFileSync(seedPath, 'utf8');
        const match = raw.match(/const SEED_DATA\s*=\s*(\[[\s\S]*?\]);/);
        if (match) {
          const seeds = JSON.parse(match[1]);
          const sql = `INSERT OR IGNORE INTO procedures
            (id,nr,year,viti_shpalljes,viti_vleresimit,description,ref,
             fondi_limit,vlera_fituesit,ne_pct,kursimi,kursimi_pct,
             lloji,nr_ofertave,nr_operatoreve,data_shpalljes,data_hapjes,
             e_perfunduar,e_anulluar,notes,last_edited_at,edited_by)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
          for (const r of seeds) {
            await dbRun(sql, [
              r.id, r.nr||null, r.year||2025, r.vitiShpalljes||r.year||2025,
              r.vitiVleresimit||r.year||2025, r.description||'', r.ref||'',
              r.fondiLimit||0, r.vleraFituesit||0, r.nePct||0, r.kursimi||0, r.kursimiPct||0,
              r.lloji||'', r.nrOfertave||0, r.nrOperatoreve||0,
              r.dataShpalljes||'', r.dataHapjes||'',
              1, 0, r.notes||'', null, null,
            ]);
          }
          console.log(`Loaded ${seeds.length} rows from seedData.js`);
        }
      }
    } catch(e) { console.warn('Could not load seed data:', e.message); }
  }
}

// ── Middleware ─────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ── Auth middleware ────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}
function requireEditor(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role === 'editor' || req.user.role === 'admin') return next();
    res.status(403).json({ error: 'Editor role required' });
  });
}
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role === 'admin') return next();
    res.status(403).json({ error: 'Admin role required' });
  });
}

// ── DB row → JS object ─────────────────────────────────────────
function toJs(r) {
  if (!r) return null;
  return {
    id: r.id, nr: r.nr, year: r.year,
    vitiShpalljes: r.viti_shpalljes, vitiVleresimit: r.viti_vleresimit,
    description: r.description, ref: r.ref,
    fondiLimit: r.fondi_limit, vleraFituesit: r.vlera_fituesit,
    nePct: r.ne_pct, kursimi: r.kursimi, kursimiPct: r.kursimi_pct,
    lloji: r.lloji, nrOfertave: r.nr_ofertave, nrOperatoreve: r.nr_operatoreve,
    dataShpalljes: r.data_shpalljes, dataHapjes: r.data_hapjes,
    ePerfunduar: r.e_perfunduar === 1, eAnulluar: r.e_anulluar === 1,
    notes: r.notes || '', lastEditedAt: r.last_edited_at,
    editedBy: r.edited_by, updatedAt: r.updated_at,
  };
}

// ── ROUTES ─────────────────────────────────────────────────────

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Plotësoni të gjitha fushat' });
  if (username.length < 2)    return res.status(400).json({ error: 'Emri shumë i shkurtër (min 2)' });
  if (password.length < 4)    return res.status(400).json({ error: 'Fjalëkalimi shumë i shkurtër (min 4)' });
  try {
    const total = (await dbGet('SELECT COUNT(*) as c FROM users')).c;
    const role  = total === 0 ? 'admin' : 'viewer';
    const hash  = bcrypt.hashSync(password, 10);
    await dbRun('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username.trim(), hash, role]);
    const user  = await dbGet('SELECT * FROM users WHERE username = ?', [username.trim()]);
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch(e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Emri i përdoruesit është i zënë' });
    res.status(500).json({ error: e.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Plotësoni të gjitha fushat' });
  try {
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Emri ose fjalëkalimi i gabuar' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Get current user info (used to re-verify role after promotion)
app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const user = await dbGet('SELECT id, username, role FROM users WHERE id=?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Get all rows
app.get('/api/rows', requireAuth, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM procedures ORDER BY nr DESC, id DESC');
    const last = await dbGet('SELECT MAX(updated_at) as t FROM procedures');
    res.json({ rows: rows.map(toJs), lastUpdate: last.t });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Last update timestamp (for polling)
app.get('/api/rows/lastupdate', requireAuth, async (req, res) => {
  try {
    const r = await dbGet('SELECT MAX(updated_at) as t FROM procedures');
    res.json({ lastUpdate: r.t });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Update one field
app.put('/api/rows/:id', requireEditor, async (req, res) => {
  const { field, value } = req.body;
  const { id } = req.params;
  const fieldMap = {
    nr:'nr', year:'year',
    vitiShpalljes:'viti_shpalljes', vitiVleresimit:'viti_vleresimit',
    description:'description', ref:'ref',
    fondiLimit:'fondi_limit', vleraFituesit:'vlera_fituesit',
    nePct:'ne_pct', kursimi:'kursimi', kursimiPct:'kursimi_pct',
    lloji:'lloji', nrOfertave:'nr_ofertave', nrOperatoreve:'nr_operatoreve',
    dataShpalljes:'data_shpalljes', dataHapjes:'data_hapjes',
    ePerfunduar:'e_perfunduar', eAnulluar:'e_anulluar', notes:'notes',
  };
  const col = fieldMap[field];
  if (!col) return res.status(400).json({ error: `Unknown field: ${field}` });
  const dbVal = (field === 'ePerfunduar' || field === 'eAnulluar') ? (value ? 1 : 0) : value;
  const now   = new Date().toISOString();
  try {
    await dbRun(`UPDATE procedures SET ${col}=?, last_edited_at=?, edited_by=?, updated_at=? WHERE id=?`,
      [dbVal, now, req.user.username, now, id]);
    const updated = await dbGet('SELECT * FROM procedures WHERE id=?', [id]);
    res.json(toJs(updated));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Toggle flag
app.put('/api/rows/:id/flag', requireEditor, async (req, res) => {
  const { flag } = req.body;
  const { id }   = req.params;
  if (!['ePerfunduar','eAnulluar'].includes(flag))
    return res.status(400).json({ error: 'Invalid flag' });
  try {
    const row    = await dbGet('SELECT * FROM procedures WHERE id=?', [id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const col    = flag === 'ePerfunduar' ? 'e_perfunduar' : 'e_anulluar';
    const newVal = row[col] === 1 ? 0 : 1;
    const now    = new Date().toISOString();
    if (flag === 'ePerfunduar' && newVal === 1)
      await dbRun('UPDATE procedures SET e_perfunduar=1, e_anulluar=0, last_edited_at=?, edited_by=?, updated_at=? WHERE id=?', [now, req.user.username, now, id]);
    else if (flag === 'eAnulluar' && newVal === 1)
      await dbRun('UPDATE procedures SET e_anulluar=1, e_perfunduar=0, last_edited_at=?, edited_by=?, updated_at=? WHERE id=?', [now, req.user.username, now, id]);
    else
      await dbRun(`UPDATE procedures SET ${col}=0, last_edited_at=?, edited_by=?, updated_at=? WHERE id=?`, [now, req.user.username, now, id]);
    const updated = await dbGet('SELECT * FROM procedures WHERE id=?', [id]);
    res.json(toJs(updated));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Add row
app.post('/api/rows', requireEditor, async (req, res) => {
  const r = req.body;
  const now = new Date().toISOString();
  try {
    await dbRun(`INSERT INTO procedures
      (id,nr,year,viti_shpalljes,viti_vleresimit,description,ref,
       fondi_limit,vlera_fituesit,ne_pct,kursimi,kursimi_pct,
       lloji,nr_ofertave,nr_operatoreve,data_shpalljes,data_hapjes,
       e_perfunduar,e_anulluar,notes,last_edited_at,edited_by,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [r.id, r.nr||null, r.year||2026, r.vitiShpalljes||2026, r.vitiVleresimit||2026,
       r.description||'', r.ref||'',
       r.fondiLimit||0, r.vleraFituesit||0, r.nePct||0, r.kursimi||0, r.kursimiPct||0,
       r.lloji||'M', r.nrOfertave||0, r.nrOperatoreve||0,
       r.dataShpalljes||'', r.dataHapjes||'',
       r.ePerfunduar?1:0, r.eAnulluar?1:0,
       r.notes||'', now, req.user.username, now]);
    const created = await dbGet('SELECT * FROM procedures WHERE id=?', [r.id]);
    res.json(toJs(created));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Restore a previously deleted row (undo delete) — editor+
app.post('/api/rows/restore', requireEditor, async (req, res) => {
  const r = req.body;
  if (!r || !r.id) return res.status(400).json({ error: 'Row data required' });
  const now = new Date().toISOString();
  try {
    // Check if row already exists
    const existing = await dbGet('SELECT id FROM procedures WHERE id=?', [r.id]);
    if (existing) return res.json({ ok: true, restored: false }); // already there
    await dbRun(`INSERT INTO procedures
      (id,nr,year,viti_shpalljes,viti_vleresimit,description,ref,
       fondi_limit,vlera_fituesit,ne_pct,kursimi,kursimi_pct,
       lloji,nr_ofertave,nr_operatoreve,data_shpalljes,data_hapjes,
       e_perfunduar,e_anulluar,notes,last_edited_at,edited_by,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [r.id, r.nr||null, r.year||2026, r.vitiShpalljes||2026, r.vitiVleresimit||2026,
       r.description||'', r.ref||'',
       r.fondiLimit||0, r.vleraFituesit||0, r.nePct||0, r.kursimi||0, r.kursimiPct||0,
       r.lloji||'M', r.nrOfertave||0, r.nrOperatoreve||0,
       r.dataShpalljes||'', r.dataHapjes||'',
       r.ePerfunduar?1:0, r.eAnulluar?1:0,
       r.notes||'', now, req.user.username, now]);
    const restored = await dbGet('SELECT * FROM procedures WHERE id=?', [r.id]);
    res.json({ ok: true, restored: true, row: toJs(restored) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Delete row
app.delete('/api/rows/:id', requireEditor, async (req, res) => {
  try {
    await dbRun('DELETE FROM procedures WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Import (bulk replace)
app.post('/api/rows/import', requireAdmin, async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'rows must be an array' });
  const now = new Date().toISOString();
  try {
    await dbRun('DELETE FROM procedures');
    for (const r of rows) {
      await dbRun(`INSERT INTO procedures
        (id,nr,year,viti_shpalljes,viti_vleresimit,description,ref,
         fondi_limit,vlera_fituesit,ne_pct,kursimi,kursimi_pct,
         lloji,nr_ofertave,nr_operatoreve,data_shpalljes,data_hapjes,
         e_perfunduar,e_anulluar,notes,last_edited_at,edited_by,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [r.id, r.nr||null, r.year||2026, r.vitiShpalljes||2026, r.vitiVleresimit||2026,
         r.description||'', r.ref||'',
         r.fondiLimit||0, r.vleraFituesit||0, r.nePct||0, r.kursimi||0, r.kursimiPct||0,
         r.lloji||'M', r.nrOfertave||0, r.nrOperatoreve||0,
         r.dataShpalljes||'', r.dataHapjes||'',
         r.ePerfunduar?1:0, r.eAnulluar?1:0,
         r.notes||'', r.lastEditedAt||null, r.editedBy||null, now]);
    }
    res.json({ ok: true, count: rows.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Reset to seed
app.post('/api/rows/reset', requireAdmin, async (req, res) => {
  try {
    const seedPath = path.join(__dirname, '..', 'src', 'data', 'seedData.js');
    const raw      = fs.readFileSync(seedPath, 'utf8');
    const match    = raw.match(/const SEED_DATA\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) return res.status(500).json({ error: 'seedData.js not found' });
    const seeds = JSON.parse(match[1]);
    const now   = new Date().toISOString();
    await dbRun('DELETE FROM procedures');
    for (const r of seeds) {
      await dbRun(`INSERT INTO procedures
        (id,nr,year,viti_shpalljes,viti_vleresimit,description,ref,
         fondi_limit,vlera_fituesit,ne_pct,kursimi,kursimi_pct,
         lloji,nr_ofertave,nr_operatoreve,data_shpalljes,data_hapjes,
         e_perfunduar,e_anulluar,notes,last_edited_at,edited_by,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [r.id,r.nr||null,r.year||2025,r.vitiShpalljes||r.year||2025,r.vitiVleresimit||r.year||2025,
         r.description||'',r.ref||'',
         r.fondiLimit||0,r.vleraFituesit||0,r.nePct||0,r.kursimi||0,r.kursimiPct||0,
         r.lloji||'',r.nrOfertave||0,r.nrOperatoreve||0,
         r.dataShpalljes||'',r.dataHapjes||'',
         1,0,'',null,null,now]);
    }
    res.json({ ok: true, count: seeds.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// List users (admin)
app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const users = await dbAll('SELECT id, username, role, created_at FROM users ORDER BY created_at ASC');
    res.json(users);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Change role (admin)
app.put('/api/users/:id/role', requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['viewer','editor','admin'].includes(role))
    return res.status(400).json({ error: 'Invalid role' });
  if (parseInt(req.params.id) === req.user.id && role !== 'admin')
    return res.status(400).json({ error: 'Cannot change your own role' });
  try {
    await dbRun('UPDATE users SET role=? WHERE id=?', [role, req.params.id]);
    const updated = await dbGet('SELECT id, username, role, created_at FROM users WHERE id=?', [req.params.id]);
    res.json(updated);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Delete user (admin)
app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'Cannot delete yourself' });
  try {
    await dbRun('DELETE FROM users WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Start ──────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   OBP Savings Tracker — Server started   ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║   Local:   http://localhost:${PORT}          ║`);
    console.log(`║   Network: http://YOUR_IP:${PORT}            ║`);
    console.log('║   Database: server/db.sqlite              ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    console.log('Find your IP: run "ipconfig" in Command Prompt');
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
