# Attendance Dashboard — Frost Free Ventures Pvt Ltd

A high-performance, client-side React web application designed for **Frost Free Ventures Pvt Ltd** to parse raw monthly attendance Excel workbooks, apply strict dynamic shift and punctuality policies, calculate deductions, aggregate overtime credits, and provide interactive employee dashboards with calendar breakdowns.

---

## ⚡ Tech Stack & Architecture

- **React 18** (Functional components, custom hooks, memoization)
- **Vite 6** (Fast HMR and optimized production bundling)
- **Tailwind CSS 3** (Data-dense operational UI, flat surfaces, hairline borders, semantic accent palette)
- **SheetJS (`xlsx`)** (In-browser Excel workbook binary parsing)
- **Lucide React** (Consistent UI iconography)
- **Recharts** (Distribution and comparative analytics)
- **100% Client-Side Processing**: No backend server or external database required. All attendance data stays completely private in the user's browser memory.

---

## 📋 Attendance Policy & Formulas

Given shift start minutes $S$ and end minutes $E$:

### 1. Shift Window Offsets (Generic Derivations)
| Window | Offset Formula | Description |
|---|---|---|
| **On-Time Arrival** | $\le S + 15\text{m}$ | Buffer arrival window |
| **Late Arrival** | $S + 16\text{m} \dots S + 30\text{m}$ | Categorized into Late bucket |
| **Very Late Arrival** | $> S + 30\text{m}$ | Triggers Half-Day exit check |
| **Half-Day Slot 1** | $\le S + 195\text{m}$ (3h 15m) | Half-day early exit boundary |
| **Half-Day Slot 2** | $\le S + 210\text{m}$ (3h 30m) | Half-day maximum exit boundary |
| **Early Departure Window** | $E - 30\text{m} \dots E - 16\text{m}$ | Categorized into Early bucket |
| **On-Time Departure** | $\ge E - 15\text{m}$ | Buffer departure window |
| **Overtime Accrual Start** | $> E + 15\text{m}$ | OT minutes accrue after this cutoff |
| **OT 1-Day Threshold** | $E - S$ | Full shift duration in minutes |

---

### 2. Monthly Deductions & Net Day Adjustment
$$\text{Late Deduction Days} = \max(0, \text{lateCount} - 3)$$
$$\text{Early Deduction Days} = \max(0, \text{earlyCount} - 3)$$
$$\text{Half-Day Deduction Days} = \text{halfDayCount} \times 0.5$$
$$\text{Total Deduction Days} = \text{Late Deduction} + \text{Early Deduction} + \text{Half-Day Deduction}$$
$$\text{OT Days Earned} = \left\lfloor \frac{\text{totalOtMinutes}}{\text{shiftDurationMinutes}} \right\rfloor$$
$$\text{Net Days Adjustment} = \text{OT Days Earned} - \text{Total Deduction Days}$$

*Note: Remainder OT minutes reset each month and are not carried forward.*

---

## 🛡️ Data Anomaly Detection

Records where:
1. Out-time is earlier than In-time (e.g. inverted entry timestamps)
2. Departure is extremely early ($< E - 30\text{m}$) without qualifying as a half-day
3. Present status is logged without timestamps

...are highlighted with a distinct **violet warning tag** in the UI for manual managerial review instead of applying silent automatic deductions.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## 🧪 Testing with Sample Data

The dashboard includes built-in realistic sample data for **July 2026** and **August 2026** featuring:
- Diverse shifts: `10 TO 7`, `10 TO 7:30`, `8 TO 5`, `9 TO 9`, `9:30 to 7:00`
- New joiners with joining date notes
- Punctuality edge cases (3-day buffer limits, half-day Slot 1 & Slot 2)
- High OT champions
- Flagged data anomalies
