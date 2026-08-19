export type DayStatus = 'P' | 'A' | 'L' | 'WO' | 'NA';
export type ArrivalTag = 'OnTime' | 'Late' | 'VeryLate' | null;
export type DepartureTag = 'OnTime' | 'Early' | 'VeryEarly' | null;
export type HalfDaySlot = 'Slot 1' | 'Slot 2' | null;

export type ManualOverrideType =
  | 'auto'
  | 'on_time'
  | 'late'
  | 'half_day_slot_1'
  | 'half_day_slot_2'
  | 'early_leave'
  | 'anomaly';

export interface DayRecord {
  day: number;
  date: string; // ISO date YYYY-MM-DD
  dow: string;  // Mon, Tue, Wed, etc.
  status: DayStatus;
  in: string | null;  // "HH:MM"
  out: string | null; // "HH:MM"
  inMinutes: number | null;
  outMinutes: number | null;
  arrivalTag: ArrivalTag;
  departureTag: DepartureTag;
  isHalfDay: boolean;
  halfDaySlot: HalfDaySlot;
  otMinutes: number;
  dataAnomaly: boolean;
  anomalyReason?: string;
  rawIn?: any;
  rawOut?: any;
  edited?: boolean;
  editReason?: string | null;
  manualOverride?: ManualOverrideType;
  autoSundayWO?: boolean;
}

export interface EmployeeSummary {
  present: number;
  absent: number;
  leave: number;
  weeklyOff: number;
  notApplicable: number;
  recordedDays: number;
  workingDays: number; // present + absent + leave
  attendanceRatePct: number;
  lateCount: number;
  earlyCount: number;
  halfDayCount: number;
  halfDaySlot1Count: number;
  halfDaySlot2Count: number;
  lateDeductionDays: number;
  earlyDeductionDays: number;
  halfDayDeductionDays: number;
  totalDeductionDays: number;
  totalOtMinutes: number;
  otDaysEarned: number;
  remainderOtMinutes: number;
  netDaysAdjustment: number;
  anomalyCount: number;
  editedCount: number;
}

export interface ShiftWindows {
  startMinutes: number;
  endMinutes: number;
  shiftDurationMinutes: number;
  bufferArrivalEnd: number;    // S + 15
  lateWindowEnd: number;       // S + 30
  halfDayExitStart: number;    // S + 180 (3h)
  halfDayExitEnd: number;      // S + 210 (3.5h)
  slot1End: number;            // S + 195 (3h15m)
  slot2Start: number;          // S + 180 (3h)
  earlyLeaveStart: number;     // E - 30
  earlyLeaveEnd: number;       // E - 16
  bufferDepartStart: number;   // E - 15
  otStart: number;             // E + 15
  otDayThresholdMins: number;  // E - S
}

export interface Employee {
  id: string;
  sNo: number | string;
  name: string;
  originalName: string;
  note: string | null;      // e.g. "New joining 14 July 2026"
  designation: string;
  shift: string;             // raw text, e.g. "10 TO 7"
  shiftStart: number;        // minutes
  shiftEnd: number;          // minutes
  shiftWindows: ShiftWindows;
  days: DayRecord[];
  summary: EmployeeSummary;
}

export interface ParsedMonthData {
  fileName: string;
  sheetName: string;
  year: number;
  month: number; // 1-12
  monthLabel: string; // e.g. "July 2026"
  totalDaysInMonth: number;
  employees: Employee[];
  stats: {
    totalEmployees: number;
    avgAttendancePct: number;
    totalOrgDeductionDays: number;
    totalOrgOtDaysEarned: number;
    totalOrgOtHours: number;
    totalAnomaliesCount: number;
    totalEditedCount: number;
    totalPresentCount: number;
    totalAbsentCount: number;
    totalLeaveCount: number;
  };
}
