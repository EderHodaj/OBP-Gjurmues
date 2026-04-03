# OBP — Gjurmues i Kursimeve v2.0

Aplikacion React + Vite për gjurmimin e kursimeve nga procedurat e prokurimit (207 rreshta nga fleta SAVINGS e Excel-it tuaj).

---

## 🚀 Si të nisni projektin

### Hapi 1 — Instaloni Node.js (nëse nuk e keni)
Shkarkoni nga https://nodejs.org (zgjidhni versionin LTS).

### Hapi 2 — Hapni terminalin dhe navigoni te dosja e projektit
```
cd budget-tracker
```

### Hapi 3 — Instaloni paketat
```
npm install
```

### Hapi 4 — Nisni aplikacionin
```
npm run dev
```
Hapni shfletuesin te: **http://localhost:5173**

---

## ✅ Funksionalitete

### Tabela (faqja kryesore)
- **207 rreshta** nga fleta SAVINGS e Excel-it tuaj, të ngarkuara automatikisht
- **Qeliza të redaktueshme** — klikoni çdo qelizë për të ndryshuar vlerën
- **Kursimi llogaritet automatikisht** kur ndryshoni Fondi Limit ose Vlera e Fituesit
- **Regjistrim ndryshimesh** — ruhet kush dhe kur bëri çdo ndryshim
- **Filtrime** sipas vitit, llojit të procedurës, dhe kërkimit tekstual
- **Renditje** sipas çdo kolone (klikoni kokën e kolonës)
- **Faqëzim** — 50 rreshta për faqe

### Importo / Eksporto Excel
- **⬆ Importo Excel** — ngarkoni çdo skedar .xlsx me kolonat e njëjta
- **⬇ Shkarko Excel** — shkarkoni tabelën aktuale si .xlsx me totale
- **↺ Rivendos** — kthehet te 207 rreshtat origjinalë

### Paneli (Dashboard)
- **4 grafikë bazë** të ngjashëm me prezantimin PPTX:
  - Numri i procedurave
  - Fondet e prokuruara (mln €)
  - Kursimet (mln €)
  - Mesatare e ofertave
- **Krahasim historik** 2019–2025 (të dhënat nga prezantimi OBP)
- **Grafikët sipas llojit** të procedurës (M/SH/P)
- **Top 10** kursimet më të mëdha

---

## 📁 Struktura e projektit

```
src/
  data/
    seedData.js          ← 207 rreshtat nga Excel-i juaj
  components/
    BudgetTable.jsx      ← Tabela kryesore me filtrime
    EditableCell.jsx     ← Qelizë me klikim për redaktim
    ImportExportBar.jsx  ← Butonat Import/Export
    Navbar.jsx           ← Navigimi lart
    SummaryCards.jsx     ← Kartat KPI
  pages/
    TablePage.jsx        ← Faqja e tabelës
    DashboardPage.jsx    ← Faqja e grafikëve
  hooks/
    useBudget.js         ← Menaxhimi i gjendjes
  utils/
    calculations.js      ← Llogaritjet
    excelIO.js           ← Import/Export Excel
    storage.js           ← localStorage
```

---

## 💾 Ruajtja e të dhënave
Të gjitha ndryshimet ruhen automatikisht në **localStorage** të shfletuesit. Klikohi **↺ Rivendos** për të kthyer të dhënat origjinale.
