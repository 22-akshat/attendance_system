import * as XLSX from 'xlsx';
import { ParsedMonthData } from '../types/attendance';

/**
 * Exports calculated organization summary to an Excel (.xlsx) file
 */
export function exportSummaryToExcel(data: ParsedMonthData): void {
  const summaryRows = data.employees.map(emp => ({
    'S.No': emp.sNo,
    'Employee Name': emp.name,
    'Joining Note': emp.note || '',
    'Designation': emp.designation,
    'Shift Timing': emp.shift,
    'Working Days': emp.summary.workingDays,
    'Present Days': emp.summary.present,
    'Absent Days': emp.summary.absent,
    'Leave Days': emp.summary.leave,
    'Weekly Off': emp.summary.weeklyOff,
    'Attendance %': `${emp.summary.attendanceRatePct}%`,
    'Late Arrivals': emp.summary.lateCount,
    'Late Deduction (Days)': emp.summary.lateDeductionDays,
    'Early Departures': emp.summary.earlyCount,
    'Early Deduction (Days)': emp.summary.earlyDeductionDays,
    'Half Days': emp.summary.halfDayCount,
    'Slot 1 Half Days': emp.summary.halfDaySlot1Count,
    'Slot 2 Half Days': emp.summary.halfDaySlot2Count,
    'Half Day Deduction (Days)': emp.summary.halfDayDeductionDays,
    'Total Deduction Days': emp.summary.totalDeductionDays,
    'Total OT (Hours)': (emp.summary.totalOtMinutes / 60).toFixed(1),
    'OT Days Earned': emp.summary.otDaysEarned,
    'OT Remainder (Mins)': emp.summary.remainderOtMinutes,
    'Net Days Adjustment': emp.summary.netDaysAdjustment,
    'Data Anomalies Flagged': emp.summary.anomalyCount,
    'Manually Edited Days': emp.summary.editedCount || 0,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Monthly Summary Rollup');

  // Trigger download
  XLSX.writeFile(wb, `Attendance_Summary_${data.monthLabel.replace(/\s+/g, '_')}.xlsx`);
}

/**
 * Exports daily logs for a single employee to CSV
 */
export function exportEmployeeDailyLogCSV(employee: any, monthLabel: string): void {
  const headers = ['Day', 'Date', 'Day of Week', 'Status', 'In Time', 'Out Time', 'Arrival Tag', 'Departure Tag', 'Half Day', 'Half Day Slot', 'OT Minutes', 'Anomaly', 'Anomaly Reason', 'Manually Edited', 'Edit Reason'];
  const rows = employee.days.map((d: any) => [
    d.day,
    d.date,
    d.dow,
    d.status,
    d.in || '-',
    d.out || '-',
    d.arrivalTag || '-',
    d.departureTag || '-',
    d.isHalfDay ? 'Yes' : 'No',
    d.halfDaySlot || '-',
    d.otMinutes,
    d.dataAnomaly ? 'YES' : 'No',
    d.anomalyReason ? `"${d.anomalyReason.replace(/"/g, '""')}"` : '',
    d.edited ? 'Yes' : 'No',
    d.editReason ? `"${d.editReason.replace(/"/g, '""')}"` : ''
  ]);

  const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${employee.name.replace(/\s+/g, '_')}_Attendance_${monthLabel.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
