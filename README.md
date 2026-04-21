# OBP Savings Tracker v3.0 — LAN Setup

## Architecture
```
SERVER PC                          OTHER PCs ON LAN
├── server/server.js (port 3001)   → open browser: http://SERVER_IP:5173
├── server/db.sqlite (database)
└── npm run dev (React, port 5173)
```

## Setup on the SERVER PC

### Step 1 — Install dependencies

Open two terminals in the project folder.

**Terminal 1 — Server:**
```
cd server
npm install
node server.js
```
You will see: `OBP Savings Tracker — Server started`

**Terminal 2 — React app:**
```
npm install
npm run dev
```
You will see: `Local: http://localhost:5173`

### Step 2 — Find your IP address

In Command Prompt run:
```
ipconfig
```
Look for **IPv4 Address** under your network adapter.
Example: `192.168.1.45`

### Step 3 — Share with other users

Tell all users on the LAN to open their browser and go to:
```
http://192.168.1.45:5173
```
(replace with your actual IP)

---

## First-time login

1. The **first person to register** automatically becomes **Admin**
2. All other users register as **Viewer** (read-only)
3. Admin goes to ⚙️ Admin page → promotes users to Editor

---

## User roles

| Role    | Can see | Can edit | Can import/export | Can manage users |
|---------|---------|----------|-------------------|-----------------|
| Viewer  | ✅      | ❌       | Export only       | ❌              |
| Editor  | ✅      | ✅       | ✅                | ❌              |
| Admin   | ✅      | ✅       | ✅                | ✅              |

---

## Real-time sync

The app checks for changes every **5 seconds**.
If any user makes a change, all other users see it within 5 seconds automatically.

---

## Backup

The entire database is in one file: `server/db.sqlite`
Copy this file to backup all your data.

---

## Troubleshooting

**"Serveri nuk është i disponueshëm"**
→ Make sure `node server.js` is running in the `server/` folder

**Other PCs can't connect**
→ Check Windows Firewall — allow port 5173 and 3001
→ Run: `netsh advfirewall firewall add rule name="OBP App" dir=in action=allow protocol=TCP localport=5173`
→ Run: `netsh advfirewall firewall add rule name="OBP Server" dir=in action=allow protocol=TCP localport=3001`
