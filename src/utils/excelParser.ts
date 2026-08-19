import * as XLSX from 'xlsx';
import { DayRecord, DayStatus, Employee, ParsedMonthData } from '../types/attendance';
import { extractTimeMinutes } from './timeUtils';
import { cleanEmployeeNameAndNote, parseTiming } from './timingParser';
import { computeEmployeeSummary, deriveShiftWindows, evaluateDay, recalculateMonthStats } from './policyEngine';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Parses month and year from row 2 date or sheet name
 */
export function extractMonthAndYear(row2Val: any, sheetName: string): { year: number; month: number; monthLabel: string } {
  let foundMonth: number | null = null;
  let foundYear: number | null = null;

  // 1. Try parsing sheet name first (e.g. "Attendance Sheet-July-26", "Attendance Sheet-AUG-26", "July 2026")
  MONTH_NAMES.forEach((m, idx) => {
    const regex = new RegExp(`\\b${m}\\b|\\b${m.substring(0, 3)}\\b`, 'i');
    if (regex.test(sheetName)) {
      foundMonth = idx + 1;
    }
  });

  const yrMatchInSheet = sheetName.match(/\b(20\d\d|\d{2})\b/);
  if (yrMatchInSheet) {
    const yr = parseInt(yrMatchInSheet[1], 10);
    foundYear = yr < 100 ? 2000 + yr : yr;
  }

  // 2. Try parsing row 2 value if month or year not found
  if ((!foundMonth || !foundYear) && row2Val) {
    if (row2Val instanceof Date && !isNaN(row2Val.getTime())) {
      if (!foundYear) foundYear = row2Val.getFullYear();
      if (!foundMonth) foundMonth = row2Val.getMonth() + 1;
    } else {
      const str = String(row2Val).trim();
      // Test ISO pattern YYYY-MM-DD
      const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (isoMatch) {
        if (!foundYear) foundYear = parseInt(isoMatch[1], 10);
        if (!foundMonth) foundMonth = parseInt(isoMatch[2], 10);
      } else {
        // Test DD/MM/YYYY or DD-MM-YYYY
        const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
        if (dmyMatch) {
          const m = parseInt(dmyMatch[2], 10);
          const y = parseInt(dmyMatch[3], 10);
          if (m >= 1 && m <= 12 && !foundMonth) foundMonth = m;
          if (!foundYear) foundYear = y < 100 ? 2000 + y : y;
        } else {
          // Look for month names in str
          MONTH_NAMES.forEach((m, idx) => {
            if (new RegExp(`\\b${m}\\b|\\b${m.substring(0, 3)}\\b`, 'i').test(str)) {
              if (!foundMonth) foundMonth = idx + 1;
            }
          });
          const yrMatch = str.match(/\b(20\d\d|\d{2})\b/);
          if (yrMatch && !foundYear) {
            const yr = parseInt(yrMatch[1], 10);
            foundYear = yr < 100 ? 2000 + yr : yr;
          }
        }
      }
    }
  }

  // Fallbacks
  const year = foundYear || 2026;
  const month = foundMonth || 7; // Default July
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  return { year, month, monthLabel };
}

/**
 * Main parsing function for uploaded Excel workbook
 */
export async function parseAttendanceFile(file: File): Promise<ParsedMonthData> {
  const data = await file.arrayBuffer();
  return parseAttendanceArrayBuffer(data, file.name);
}

export function parseAttendanceArrayBuffer(data: ArrayBuffer, fileName: string): ParsedMonthData {
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('The uploaded Excel workbook contains no sheets.');
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Could not access sheet "${sheetName}".`);
  }

  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: null,
  });

  if (!rawRows || rawRows.length < 5) {
    throw new Error(
      `The sheet "${sheetName}" has too few rows (${rawRows?.length || 0}). Expected at least header and employee rows.`
    );
  }

  // 1. Identify Header Row (normally Row index 3, search dynamically for resilience)
  let headerRowIndex = -1;
  for (let r = 0; r < Math.min(10, rawRows.length); r++) {
    const rowStr = (rawRows[r] || []).map(c => String(c || '').toLowerCase()).join(' ');
    if (rowStr.includes('employee name') || (rowStr.includes('s.no') && rowStr.includes('timing'))) {
      headerRowIndex = r;
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 3;
  }

  // 2. Extract Month & Year
  const row2Val = rawRows[2] ? rawRows[2].find((c: any) => c !== null && c !== undefined) : null;
  const { year, month, monthLabel } = extractMonthAndYear(row2Val, sheetName);
  const daysInMonth = new Date(year, month, 0).getDate();

  // 3. Parse Employees from rows starting after header row + day of week row
  const startEmployeeRow = headerRowIndex + 2; // Row index 5
  const employees: Employee[] = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let r = startEmployeeRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const sNo = row[0];
    const rawName = row[1];

    // Stop at blank S.No or blank employee name
    if (sNo === null || sNo === undefined || String(sNo).trim() === '') {
      if (!rawName || String(rawName).trim() === '') {
        break;
      }
    }

    if (!rawName || String(rawName).trim() === '') {
      continue;
    }

    const timingStr = row[2] ? String(row[2]).trim() : '10 TO 7';
    const designation = row[3] ? String(row[3]).trim() : 'Staff';

    const { cleanName, note } = cleanEmployeeNameAndNote(String(rawName));
    const parsedShift = parseTiming(timingStr);
    const shiftWindows = deriveShiftWindows(parsedShift.startMinutes, parsedShift.endMinutes);

    // Parse each day of the month (3 columns per day)
    const days: DayRecord[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayColStart = 4 + (day - 1) * 3;
      const rawStatusCell = row[dayColStart];
      const rawInCell = row[dayColStart + 1];
      const rawOutCell = row[dayColStart + 2];

      const calDate = new Date(year, month - 1, day);
      const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dow = daysOfWeek[calDate.getDay()];
      const isSunday = calDate.getDay() === 0;

      let status: DayStatus = 'NA';
      let autoSundayWO = false;

      const statusText = rawStatusCell !== null && rawStatusCell !== undefined ? String(rawStatusCell).trim().toUpperCase() : '';
      const inText = rawInCell !== null && rawInCell !== undefined ? String(rawInCell).trim().toUpperCase() : '';
      const outText = rawOutCell !== null && rawOutCell !== undefined ? String(rawOutCell).trim().toUpperCase() : '';

      // 1. Explicit status values always win (regardless of day of week, e.g. employee worked on Sunday)
      if (statusText === 'P' || statusText === 'PRESENT' || statusText.startsWith('P')) {
        status = 'P';
      } else if (statusText === 'A' || statusText === 'ABSENT' || statusText.startsWith('A')) {
        status = 'A';
      } else if (statusText === 'L' || statusText === 'LEAVE' || statusText.startsWith('L')) {
        status = 'L';
      } else if (
        statusText === 'W/O' || statusText === 'WO' || statusText === 'W/OFF' || statusText === 'WEEKLY OFF' || statusText === 'WEEK OFF' ||
        inText === 'W/O' || inText === 'WO' || inText === 'W/OFF' || inText === 'WEEKLY OFF' || inText === 'WEEK OFF' ||
        outText === 'W/O' || outText === 'WO' || outText === 'W/OFF' || outText === 'WEEKLY OFF' || outText === 'WEEK OFF'
      ) {
        status = 'WO';
        autoSundayWO = false;
      } else if (inText !== '' || outText !== '') {
        // Punches or times present without explicit status letter
        status = 'P';
      } else if (statusText !== '') {
        if (statusText.startsWith('P')) status = 'P';
        else if (statusText.startsWith('A')) status = 'A';
        else if (statusText.startsWith('L')) status = 'L';
        else if (statusText.startsWith('W')) status = 'WO';
        else status = 'P';
      } else {
        // Raw cells are completely blank (no status letter, no "W/O" text, no in/out time)
        if (isSunday) {
          status = 'WO';
          autoSundayWO = true;
        } else {
          status = 'NA';
          autoSundayWO = false;
        }
      }

      // Parse Times
      let inParsed = extractTimeMinutes(rawInCell);
      let outParsed = extractTimeMinutes(rawOutCell);

      // If status is WO or NA or A or L, times should not be active
      if (status !== 'P') {
        inParsed = { minutes: null, timeStr: null, isMalformed: false };
        outParsed = { minutes: null, timeStr: null, isMalformed: false };
      }

      // Evaluate Day
      const evalResult = evaluateDay(status, inParsed.minutes, outParsed.minutes, shiftWindows);

      // Check for malformed cells
      let isDataAnomaly = evalResult.dataAnomaly || inParsed.isMalformed || outParsed.isMalformed;
      let anomalyReason = evalResult.anomalyReason;

      if ((inParsed.isMalformed || outParsed.isMalformed) && status === 'P') {
        isDataAnomaly = true;
        anomalyReason = anomalyReason || 'Malformed time format in cell';
      }

      days.push({
        day,
        date: isoDate,
        dow,
        status,
        in: inParsed.timeStr,
        out: outParsed.timeStr,
        inMinutes: inParsed.minutes,
        outMinutes: outParsed.minutes,
        arrivalTag: evalResult.arrivalTag,
        departureTag: evalResult.departureTag,
        isHalfDay: evalResult.isHalfDay,
        halfDaySlot: evalResult.halfDaySlot,
        otMinutes: evalResult.otMinutes,
        dataAnomaly: isDataAnomaly,
        anomalyReason,
        rawIn: rawInCell,
        rawOut: rawOutCell,
        edited: false,
        editReason: null,
        manualOverride: 'auto',
        autoSundayWO,
      });
    }

    const summary = computeEmployeeSummary(days, shiftWindows);

    employees.push({
      id: `emp-${r}-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      sNo: sNo ?? employees.length + 1,
      name: cleanName,
      originalName: String(rawName).trim(),
      note,
      designation,
      shift: timingStr,
      shiftStart: parsedShift.startMinutes,
      shiftEnd: parsedShift.endMinutes,
      shiftWindows,
      days,
      summary,
    });
  }

  if (employees.length === 0) {
    throw new Error(
      `No valid employee rows could be parsed from sheet "${sheetName}". Please ensure employee rows start at row 6 with names and timing.`
    );
  }

  // 4. Compute Org-level stats
  const stats = recalculateMonthStats(employees);

  return {
    fileName,
    sheetName,
    year,
    month,
    monthLabel,
    totalDaysInMonth: daysInMonth,
    employees,
    stats,
  };
}
