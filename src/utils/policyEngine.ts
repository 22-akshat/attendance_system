import { DayRecord, DayStatus, Employee, EmployeeSummary, ManualOverrideType, ShiftWindows } from '../types/attendance';

/**
 * Derives generic shift windows given start and end minutes
 */
export function deriveShiftWindows(startMinutes: number, endMinutes: number): ShiftWindows {
  return {
    startMinutes,
    endMinutes,
    shiftDurationMinutes: endMinutes - startMinutes,
    bufferArrivalEnd: startMinutes + 15,      // on-time up to 15 min after shift start
    lateWindowEnd: startMinutes + 30,         // 16–30 min after start = "Late"
    halfDayExitStart: startMinutes + 180,     // 3 hours after start
    halfDayExitEnd: startMinutes + 210,       // 3.5 hours after start
    slot1End: startMinutes + 195,             // "Slot 1" half-day boundary (3h15m after start)
    slot2Start: startMinutes + 180,           // "Slot 2" half-day boundary (3h after start)
    earlyLeaveStart: endMinutes - 30,
    earlyLeaveEnd: endMinutes - 16,           // 14-minute early-leave penalty window
    bufferDepartStart: endMinutes - 15,       // on-time departure in the last 15 minutes
    otStart: endMinutes + 15,                 // overtime accrues only after this
    otDayThresholdMins: endMinutes - startMinutes, // OT hours needed to equal "1 day"
  };
}

export interface DayEvaluationResult {
  arrivalTag: 'OnTime' | 'Late' | 'VeryLate' | null;
  departureTag: 'OnTime' | 'Early' | 'VeryEarly' | null;
  isHalfDay: boolean;
  halfDaySlot: 'Slot 1' | 'Slot 2' | null;
  isLateBucket: boolean;
  isEarlyBucket: boolean;
  otMinutes: number;
  dataAnomaly: boolean;
  anomalyReason?: string;
}

/**
 * Classify a single day record for an employee with a given shift using Step 4 rules
 */
export function evaluateDay(
  status: DayStatus,
  inMinutes: number | null,
  outMinutes: number | null,
  windows: ShiftWindows
): DayEvaluationResult {
  const result: DayEvaluationResult = {
    arrivalTag: null,
    departureTag: null,
    isHalfDay: false,
    halfDaySlot: null,
    isLateBucket: false,
    isEarlyBucket: false,
    otMinutes: 0,
    dataAnomaly: false,
    anomalyReason: undefined,
  };

  // Only evaluate time punctuality / OT for Present days
  if (status !== 'P') {
    return result;
  }

  // 1. Broken data check (highest priority)
  // Non-positive duration, missing timestamps on 'P', or worked < 60 mins -> Data Anomaly
  if (inMinutes === null || outMinutes === null) {
    result.dataAnomaly = true;
    result.anomalyReason =
      inMinutes === null && outMinutes === null
        ? 'Present marked without In and Out times'
        : inMinutes === null
        ? 'Missing In-time on Present day'
        : 'Missing Out-time on Present day';
    return result;
  }

  if (outMinutes <= inMinutes) {
    result.dataAnomaly = true;
    const inStr = `${Math.floor(inMinutes / 60).toString().padStart(2, '0')}:${(inMinutes % 60).toString().padStart(2, '0')}`;
    const outStr = `${Math.floor(outMinutes / 60).toString().padStart(2, '0')}:${(outMinutes % 60).toString().padStart(2, '0')}`;
    result.anomalyReason =
      outMinutes === inMinutes
        ? `In-time and Out-time are identical (${inStr})`
        : `Out-time (${outStr}) is earlier than In-time (${inStr})`;
    return result;
  }

  const minutesWorked = outMinutes - inMinutes;
  if (minutesWorked < 60) {
    result.dataAnomaly = true;
    result.anomalyReason = `Worked less than 1 hour (${minutesWorked} mins) on a Present day`;
    return result;
  }

  const shiftDurationMins = windows.shiftDurationMinutes > 0 ? windows.shiftDurationMinutes : 9 * 60;
  const workedPct = minutesWorked / shiftDurationMins;

  // 2. Arrival lateness (only relevant if not already caught by broken data check)
  if (inMinutes <= windows.bufferArrivalEnd) {
    result.arrivalTag = 'OnTime';
  } else if (inMinutes <= windows.lateWindowEnd) {
    result.arrivalTag = 'Late';
    result.isLateBucket = true;
  } else {
    result.arrivalTag = 'VeryLate';
  }

  // 3. Half-day check (bidirectional)
  // Case A: early departure after normal or late-but-acceptable arrival, worked < 60% of shift
  if ((result.arrivalTag === 'OnTime' || result.arrivalTag === 'Late') && workedPct < 0.6) {
    result.isHalfDay = true;
    result.halfDaySlot = 'Slot 1';
  }
  // Case B: very late arrival that also leaves early (in > lateWindowEnd AND out <= halfDayExitEnd)
  else if (result.arrivalTag === 'VeryLate' && outMinutes <= windows.halfDayExitEnd) {
    result.isHalfDay = true;
    result.halfDaySlot = outMinutes <= windows.slot1End ? 'Slot 1' : 'Slot 2';
  }
  // If arrival was "Very late" but out > halfDayExitEnd -> not a half day, falls through to Late bucket
  else if (result.arrivalTag === 'VeryLate') {
    result.isLateBucket = true;
  }

  // 4. Early leave check (only reached if the day was NOT classified as a half day or anomaly above)
  if (!result.isHalfDay) {
    if (outMinutes >= windows.bufferDepartStart) {
      result.departureTag = 'OnTime';
    } else {
      // earlyLeaveStart <= out < bufferDepartStart
      result.departureTag = 'Early';
      result.isEarlyBucket = true;
    }
  }

  // 5. Overtime check (computed independently whenever out > otStart)
  if (outMinutes > windows.otStart) {
    result.otMinutes = Math.max(0, outMinutes - windows.otStart);
  }

  return result;
}

/**
 * Classify a day record incorporating manual managerial overrides
 */
export function evaluateDayWithOverride(
  status: DayStatus,
  inMinutes: number | null,
  outMinutes: number | null,
  windows: ShiftWindows,
  manualOverride?: ManualOverrideType,
  overrideReason?: string
): DayEvaluationResult {
  // If override is 'auto' or unspecified, use standard automated classification
  if (!manualOverride || manualOverride === 'auto') {
    return evaluateDay(status, inMinutes, outMinutes, windows);
  }

  // Baseline if non-present
  if (status !== 'P') {
    return {
      arrivalTag: null,
      departureTag: null,
      isHalfDay: false,
      halfDaySlot: null,
      isLateBucket: false,
      isEarlyBucket: false,
      otMinutes: 0,
      dataAnomaly: manualOverride === 'anomaly',
      anomalyReason: manualOverride === 'anomaly' ? (overrideReason || 'Manual anomaly override') : undefined,
    };
  }

  // Calculate OT if out-time qualifies
  let otMinutes = 0;
  if (outMinutes !== null && outMinutes > windows.otStart) {
    otMinutes = Math.max(0, outMinutes - windows.otStart);
  }

  const result: DayEvaluationResult = {
    arrivalTag: 'OnTime',
    departureTag: 'OnTime',
    isHalfDay: false,
    halfDaySlot: null,
    isLateBucket: false,
    isEarlyBucket: false,
    otMinutes,
    dataAnomaly: false,
    anomalyReason: undefined,
  };

  switch (manualOverride) {
    case 'on_time':
      result.arrivalTag = 'OnTime';
      result.departureTag = 'OnTime';
      break;
    case 'late':
      result.arrivalTag = 'Late';
      result.isLateBucket = true;
      result.departureTag = 'OnTime';
      break;
    case 'half_day_slot_1':
      result.isHalfDay = true;
      result.halfDaySlot = 'Slot 1';
      break;
    case 'half_day_slot_2':
      result.isHalfDay = true;
      result.halfDaySlot = 'Slot 2';
      break;
    case 'early_leave':
      result.arrivalTag = 'OnTime';
      result.departureTag = 'Early';
      result.isEarlyBucket = true;
      break;
    case 'anomaly':
      result.dataAnomaly = true;
      result.anomalyReason = overrideReason || 'Manual anomaly override (ignored in calculations)';
      result.arrivalTag = null;
      result.departureTag = null;
      result.isHalfDay = false;
      result.otMinutes = 0;
      break;
  }

  return result;
}

/**
 * Compute monthly summary rollup for an employee across all days
 */
export function computeEmployeeSummary(
  days: DayRecord[],
  shiftWindows: ShiftWindows
): EmployeeSummary {
  let present = 0;
  let absent = 0;
  let leave = 0;
  let weeklyOff = 0;
  let notApplicable = 0;

  let lateCount = 0;
  let earlyCount = 0;
  let halfDayCount = 0;
  let halfDaySlot1Count = 0;
  let halfDaySlot2Count = 0;
  let totalOtMinutes = 0;
  let anomalyCount = 0;
  let editedCount = 0;

  for (const day of days) {
    switch (day.status) {
      case 'P':
        present++;
        break;
      case 'A':
        absent++;
        break;
      case 'L':
        leave++;
        break;
      case 'WO':
        weeklyOff++;
        break;
      case 'NA':
        notApplicable++;
        break;
    }

    if (day.status === 'P') {
      if (day.arrivalTag === 'Late' || (day.arrivalTag === 'VeryLate' && !day.isHalfDay)) {
        lateCount++;
      }
      if (day.departureTag === 'Early' && !day.isHalfDay) {
        earlyCount++;
      }
      if (day.isHalfDay) {
        halfDayCount++;
        if (day.halfDaySlot === 'Slot 1') halfDaySlot1Count++;
        if (day.halfDaySlot === 'Slot 2') halfDaySlot2Count++;
      }
      totalOtMinutes += day.otMinutes || 0;
    }

    if (day.dataAnomaly) {
      anomalyCount++;
    }

    if (day.edited) {
      editedCount++;
    }
  }

  const recordedDays = present + absent + leave + weeklyOff;
  const workingDays = present + absent + leave;
  const attendanceRatePct = workingDays > 0 ? Math.round((present / workingDays) * 1000) / 10 : 0;

  // Monthly deduction formulas:
  // lateDeductionDays = max(0, lateCount - 3) (first 3 free, each after = 1 full day)
  const lateDeductionDays = Math.max(0, lateCount - 3);

  // earlyDeductionDays = max(0, earlyCount - 3) (first 3 free, each after = 1 full day)
  const earlyDeductionDays = Math.max(0, earlyCount - 3);

  // halfDayDeductionDays = halfDayCount * 0.5 (every half day = 0.5 day, no free allowance)
  const halfDayDeductionDays = halfDayCount * 0.5;

  const totalDeductionDays = lateDeductionDays + earlyDeductionDays + halfDayDeductionDays;

  // OT Days Earned:
  const otThreshold = shiftWindows.otDayThresholdMins > 0 ? shiftWindows.otDayThresholdMins : 9 * 60;
  const otDaysEarned = Math.floor(totalOtMinutes / otThreshold);
  const remainderOtMinutes = totalOtMinutes % otThreshold;

  // Net Days Adjustment:
  const netDaysAdjustment = otDaysEarned - totalDeductionDays;

  return {
    present,
    absent,
    leave,
    weeklyOff,
    notApplicable,
    recordedDays,
    workingDays,
    attendanceRatePct,
    lateCount,
    earlyCount,
    halfDayCount,
    halfDaySlot1Count,
    halfDaySlot2Count,
    lateDeductionDays,
    earlyDeductionDays,
    halfDayDeductionDays,
    totalDeductionDays,
    totalOtMinutes,
    otDaysEarned,
    remainderOtMinutes,
    netDaysAdjustment,
    anomalyCount,
    editedCount,
  };
}

/**
 * Recalculate org-level statistics from an array of employee records
 */
export function recalculateMonthStats(employees: Employee[]) {
  const totalEmployees = employees.length;
  const avgAttendancePct =
    totalEmployees > 0
      ? Math.round((employees.reduce((acc, e) => acc + e.summary.attendanceRatePct, 0) / totalEmployees) * 10) / 10
      : 0;
  const totalOrgDeductionDays = employees.reduce((acc, e) => acc + e.summary.totalDeductionDays, 0);
  const totalOrgOtDaysEarned = employees.reduce((acc, e) => acc + e.summary.otDaysEarned, 0);
  const totalOrgOtHours = Math.round((employees.reduce((acc, e) => acc + e.summary.totalOtMinutes, 0) / 60) * 10) / 10;
  const totalAnomaliesCount = employees.reduce((acc, e) => acc + e.summary.anomalyCount, 0);
  const totalEditedCount = employees.reduce((acc, e) => acc + (e.summary.editedCount || 0), 0);
  const totalPresentCount = employees.reduce((acc, e) => acc + e.summary.present, 0);
  const totalAbsentCount = employees.reduce((acc, e) => acc + e.summary.absent, 0);
  const totalLeaveCount = employees.reduce((acc, e) => acc + e.summary.leave, 0);

  return {
    totalEmployees,
    avgAttendancePct,
    totalOrgDeductionDays,
    totalOrgOtDaysEarned,
    totalOrgOtHours,
    totalAnomaliesCount,
    totalEditedCount,
    totalPresentCount,
    totalAbsentCount,
    totalLeaveCount,
  };
}
