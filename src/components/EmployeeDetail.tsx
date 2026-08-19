import React, { useState } from 'react';
import { DayRecord, DayStatus, Employee, ManualOverrideType } from '../types/attendance';
import {
  ArrowLeft,
  Calendar,
  Clock,
  AlertTriangle,
  Award,
  CheckCircle2,
  Download,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sliders,
  Table as TableIcon,
  LayoutGrid,
  Edit3,
  Pencil,
  X,
  Save
} from 'lucide-react';
import { minutesTo12HourString, formatDurationHours } from '../utils/timeUtils';
import { exportEmployeeDailyLogCSV } from '../utils/exportUtils';

interface EmployeeDetailProps {
  employee: Employee;
  monthLabel: string;
  onBack: () => void;
  onUpdateDayRecord: (
    employeeId: string,
    dayNumber: number,
    update: {
      status: DayStatus;
      in: string | null;
      out: string | null;
      manualOverride: ManualOverrideType;
      editReason: string | null;
    }
  ) => void;
}

export const EmployeeDetail: React.FC<EmployeeDetailProps> = ({
  employee,
  monthLabel,
  onBack,
  onUpdateDayRecord,
}) => {
  const [activeView, setActiveView] = useState<'calendar' | 'table'>('calendar');
  const [showPolicyPanel, setShowPolicyPanel] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // Manual Edit Popover State
  const [editingDay, setEditingDay] = useState<DayRecord | null>(null);
  const [editStatus, setEditStatus] = useState<DayStatus>('P');
  const [editIn, setEditIn] = useState<string>('');
  const [editOut, setEditOut] = useState<string>('');
  const [editOverride, setEditOverride] = useState<ManualOverrideType>('auto');
  const [editReason, setEditReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const startEditing = (day: DayRecord) => {
    setEditingDay(day);
    setEditStatus(day.status);
    setEditIn(day.in || '');
    setEditOut(day.out || '');
    setEditOverride(day.manualOverride || 'auto');
    setEditReason(day.editReason || '');
    setFormError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDay) return;

    // Reason is required if manual override is not 'auto'
    if (editOverride !== 'auto' && !editReason.trim()) {
      setFormError('Reason for change is required when selecting a manual classification override.');
      return;
    }

    onUpdateDayRecord(employee.id, editingDay.day, {
      status: editStatus,
      in: editStatus === 'P' ? (editIn.trim() || null) : null,
      out: editStatus === 'P' ? (editOut.trim() || null) : null,
      manualOverride: editOverride,
      editReason: editReason.trim() || null,
    });

    setEditingDay(null);
    setFormError(null);
  };

  const handleCancelEdit = () => {
    setEditingDay(null);
    setFormError(null);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const w = employee.shiftWindows;
  const s = employee.summary;

  // Find anomalous days
  const anomalousDays = employee.days.filter(d => d.dataAnomaly);

  // Group days by week for calendar layout (7 days per week)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Position day 1 correctly in the 7-col grid:
  const firstDayRecord = employee.days[0];
  const firstDayDate = firstDayRecord ? new Date(firstDayRecord.date) : new Date();
  const firstDayOfWeekIndex = firstDayDate.getDay(); // 0 for Sun, 1 for Mon, etc.

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-5 md:space-y-6 max-w-7xl mx-auto w-full relative transition-colors">
      {/* Back Button & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Employees</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportEmployeeDailyLogCSV(employee, monthLabel)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Daily Log (.csv)</span>
          </button>
        </div>
      </div>

      {/* Employee Header Profile Card */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 md:p-6 relative overflow-hidden shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            {/* Avatar Initials */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600 border border-indigo-400/40 flex items-center justify-center font-black text-lg sm:text-xl text-white shadow-lg shadow-indigo-600/20 shrink-0">
              {getInitials(employee.name)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {employee.name}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                  S.No {employee.sNo}
                </span>
                {employee.note && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 font-medium">
                    {employee.note}
                  </span>
                )}
                {s.editedCount > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 font-medium flex items-center gap-1">
                    <Edit3 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>{s.editedCount} Manually Edited</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{employee.designation}</span>
                <span>&bull;</span>
                <span className="font-mono bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  Shift: {employee.shift} ({minutesTo12HourString(employee.shiftStart)} - {minutesTo12HourString(employee.shiftEnd)})
                </span>
                <span>&bull;</span>
                <span className="text-slate-500 dark:text-slate-400">
                  Length: {(w.shiftDurationMinutes / 60).toFixed(1)} hrs ({w.shiftDurationMinutes}m)
                </span>
              </div>
            </div>
          </div>

          {/* Net Adjustment Highlight */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800 shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Net Day Adjustment</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono px-3 py-0.5 rounded-xl border ${
                  s.netDaysAdjustment < 0
                    ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/70'
                    : s.netDaysAdjustment > 0
                    ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/70'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {s.netDaysAdjustment > 0 ? `+${s.netDaysAdjustment}d` : `${s.netDaysAdjustment}d`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Metric Card Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-1 shadow-sm transition-colors">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Present Days</span>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{s.present}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Out of {s.workingDays} working</div>
        </div>

        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-1 shadow-sm transition-colors">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Absent Days</span>
          <div className="text-lg sm:text-xl font-extrabold text-red-600 dark:text-red-400">{s.absent}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Unapproved absence</div>
        </div>

        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-1 shadow-sm transition-colors">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Leaves Taken</span>
          <div className="text-lg sm:text-xl font-extrabold text-amber-600 dark:text-amber-400">{s.leave}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Approved leaves</div>
        </div>

        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-1 shadow-sm transition-colors">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Weekly Offs</span>
          <div className="text-lg sm:text-xl font-extrabold text-slate-700 dark:text-slate-300">{s.weeklyOff}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Sundays / W-Off</div>
        </div>

        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-1 shadow-sm transition-colors">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Attendance Rate</span>
          <div className="text-lg sm:text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{s.attendanceRatePct}%</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Present / (P+A+L)</div>
        </div>

        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-1 shadow-sm transition-colors">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Deductions</span>
          <div className="text-lg sm:text-xl font-extrabold text-red-600 dark:text-red-400">-{s.totalDeductionDays.toFixed(1)}d</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">Late + Early + Half</div>
        </div>
      </div>

      {/* Punctuality Breakdown Cards (3 Cards) + Overtime Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Late Arrivals */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Late Arrivals</span>
            </div>
            <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {s.lateCount} days
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Allowance (Free):</span>
              <span className="text-slate-500 dark:text-slate-400 font-mono">3 days max</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Penalty Rate:</span>
              <span className="text-slate-500 dark:text-slate-400">1 day per late &gt; 3</span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-bold">
              <span className="text-slate-800 dark:text-slate-200">Late Deductions:</span>
              <span className="text-red-600 dark:text-red-400 font-mono">-{s.lateDeductionDays} days</span>
            </div>
          </div>
        </div>

        {/* Early Departures */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Early Departures</span>
            </div>
            <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {s.earlyCount} days
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Allowance (Free):</span>
              <span className="text-slate-500 dark:text-slate-400 font-mono">3 days max</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Penalty Window:</span>
              <span className="text-slate-500 dark:text-slate-400 font-mono">E-30 to E-16</span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-bold">
              <span className="text-slate-800 dark:text-slate-200">Early Deductions:</span>
              <span className="text-orange-600 dark:text-orange-400 font-mono">-{s.earlyDeductionDays} days</span>
            </div>
          </div>
        </div>

        {/* Half Days */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Half Days</span>
            </div>
            <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {s.halfDayCount} days
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Slot 1 (worked &lt;60% or out&le;3h15m):</span>
              <span className="text-purple-600 dark:text-purple-300 font-mono">{s.halfDaySlot1Count}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Slot 2 (very late &amp; out&le;3h30m):</span>
              <span className="text-purple-600 dark:text-purple-300 font-mono">{s.halfDaySlot2Count}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-bold">
              <span className="text-slate-800 dark:text-slate-200">Half-Day Deductions:</span>
              <span className="text-purple-600 dark:text-purple-400 font-mono">-{s.halfDayDeductionDays.toFixed(1)} days</span>
            </div>
          </div>
        </div>

        {/* Overtime */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Overtime Accrual</span>
            </div>
            <span className="text-xs font-bold font-mono text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/60">
              +{s.otDaysEarned} days earned
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Total OT Logged:</span>
              <span className="text-slate-900 dark:text-slate-100 font-mono font-semibold">
                {formatDurationHours(s.totalOtMinutes)} ({(s.totalOtMinutes / 60).toFixed(1)}h)
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Remainder OT:</span>
              <span className="text-slate-500 dark:text-slate-400 font-mono">{s.remainderOtMinutes} mins</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic leading-tight pt-1">
              * Remainder minutes reset each month; not carried forward.
            </p>
          </div>
        </div>
      </div>

      {/* Data Anomaly Callout (if any flagged) */}
      {anomalousDays.length > 0 && (
        <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-700/60 rounded-2xl p-4 sm:p-5 space-y-3 shadow-md animate-in fade-in transition-colors">
          <div className="flex items-center gap-2 text-violet-800 dark:text-violet-300 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
            <span>{anomalousDays.length} Data Anomaly Flagged for Manual Review</span>
          </div>
          <p className="text-xs text-violet-700 dark:text-violet-200/80 leading-relaxed">
            The following records have malformed or irregular timestamps (such as non-positive duration, under 1h on present day, or missing punches). Click "Resolve / Edit" to correct them:
          </p>
          <div className="space-y-2 pt-1">
            {anomalousDays.map(d => (
              <div
                key={d.day}
                className="bg-white dark:bg-slate-950/80 border border-violet-200 dark:border-violet-800/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 font-mono font-bold">
                    Day {d.day} ({d.dow})
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    In: <code className="text-slate-700 dark:text-slate-300 font-mono">{d.in || 'Blank'}</code> &bull; Out: <code className="text-slate-700 dark:text-slate-300 font-mono">{d.out || 'Blank'}</code>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-violet-700 dark:text-violet-300 font-medium text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                    <span>{d.anomalyReason || 'Irregular entry — check manually'}</span>
                  </div>
                  <button
                    onClick={() => startEditing(d)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] flex items-center gap-1 transition shadow-sm"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Resolve / Edit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policy Reference Panel for This Employee's Shift (Collapsible) */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
        <button
          onClick={() => setShowPolicyPanel(!showPolicyPanel)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition select-none"
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                Shift Timing &amp; Clock Windows Audit Reference
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Exact computed clock thresholds for shift &ldquo;{employee.shift}&rdquo;
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            <span>{showPolicyPanel ? 'Hide Windows' : 'Audit Windows'}</span>
            {showPolicyPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showPolicyPanel && (
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1 shadow-sm">
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> On-Time Arrival
              </div>
              <div className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                &le; {minutesTo12HourString(w.bufferArrivalEnd)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Up to 15 min after shift start</div>
            </div>

            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1 shadow-sm">
              <div className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Late Arrival Window
              </div>
              <div className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                {minutesTo12HourString(w.bufferArrivalEnd + 1)} - {minutesTo12HourString(w.lateWindowEnd)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">16 - 30 min after start</div>
            </div>

            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1 shadow-sm">
              <div className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Half Day Exits
              </div>
              <div className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                Slot 1: &lt;60% worked OR &le; {minutesTo12HourString(w.slot1End)}
                <br />
                Slot 2: Very late &amp; &le; {minutesTo12HourString(w.halfDayExitEnd)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Bidirectional Case A &amp; Case B</div>
            </div>

            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1 shadow-sm">
              <div className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Overtime Accrual
              </div>
              <div className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                &gt; {minutesTo12HourString(w.otStart)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">1 OT Day = {(w.otDayThresholdMins/60).toFixed(1)} hrs logged</div>
            </div>
          </div>
        )}
      </div>

      {/* Main View: Toggle between Full Month Calendar & Daily Log Table */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-4 p-4 sm:p-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {monthLabel} Attendance Breakdown
            </h2>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setActiveView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition ${
                activeView === 'calendar'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Calendar Grid</span>
            </button>
            <button
              onClick={() => setActiveView('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition ${
                activeView === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Daily Log Table</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: Calendar Grid (7 columns with responsive horizontal scroll wrapper) */}
        {activeView === 'calendar' && (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[650px] space-y-3">
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                {weekDays.map(day => (
                  <div key={day} className="py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Cells Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty leading offset cells for first day */}
                {Array.from({ length: firstDayOfWeekIndex }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[95px] rounded-xl border border-slate-200/50 dark:border-slate-800/30 bg-slate-100/40 dark:bg-slate-950/20 opacity-30"
                  />
                ))}

                {/* Day Cells */}
                {employee.days.map(day => {
                  const isHovered = hoveredDay === day.day;
                  let bgClass = 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800';
                  let statusText = 'Present';

                  if (day.status === 'P') {
                    bgClass = 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 hover:border-emerald-400 dark:hover:border-emerald-500';
                    statusText = 'Present';
                  } else if (day.status === 'A') {
                    bgClass = 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-800/40 hover:border-red-400 dark:hover:border-red-500';
                    statusText = 'Absent';
                  } else if (day.status === 'L') {
                    bgClass = 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 hover:border-amber-400 dark:hover:border-amber-500';
                    statusText = 'Leave';
                  } else if (day.status === 'WO') {
                    bgClass = 'bg-slate-100/80 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600';
                    statusText = day.autoSundayWO ? 'Weekly Off (auto — Sunday)' : 'Weekly Off';
                  } else if (day.status === 'NA') {
                    bgClass = 'bg-slate-50 dark:bg-slate-950/30 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600';
                    statusText = 'Not Applicable';
                  }

                  return (
                    <div
                      key={day.day}
                      onMouseEnter={() => setHoveredDay(day.day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      onClick={() => startEditing(day)}
                      className={`relative min-h-[95px] rounded-xl border p-2 flex flex-col justify-between transition-all duration-150 group cursor-pointer ${bgClass} ${
                        isHovered ? 'ring-2 ring-indigo-500 shadow-lg scale-[1.02] z-10' : ''
                      } ${day.edited ? 'ring-1 ring-amber-500/50' : ''}`}
                    >
                      {/* Top Row: Day Number, Edit Icon Button, & Status Pill */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                            {day.day}
                          </span>
                          {day.edited && (
                            <span
                              title={day.editReason ? `Reason: ${day.editReason}` : 'Manually edited'}
                              className="text-amber-600 dark:text-amber-400"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(day);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-600 dark:text-slate-300 transition shadow-sm"
                            title="Click to edit day record"
                          >
                            <Pencil className="w-2.5 h-2.5" />
                          </button>
                          <span
                            className={`text-[9px] font-bold uppercase px-1 py-0.2 rounded ${
                              day.status === 'P'
                                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60'
                                : day.status === 'A'
                                ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/60'
                                : day.status === 'L'
                                ? 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60'
                                : day.status === 'WO'
                                ? 'text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {day.status}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Times or Status description */}
                      {day.status === 'P' ? (
                        <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 space-y-0.5 my-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">In:</span>
                            <span className={`${day.arrivalTag === 'Late' || day.arrivalTag === 'VeryLate' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                              {day.in || '-'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">Out:</span>
                            <span className={`${day.departureTag === 'Early' ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                              {day.out || '-'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center my-auto">
                          {statusText}
                        </div>
                      )}

                      {/* Bottom Indicators: Late / Early / Half Day / OT / Anomaly / Edited */}
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {day.edited && (
                          <span
                            title={day.editReason ? `Reason: ${day.editReason}` : 'Manually edited'}
                            className="text-[9px] font-bold px-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-0.5"
                          >
                            <Pencil className="w-2 h-2" /> Edited
                          </span>
                        )}
                        {day.arrivalTag === 'Late' && (
                          <span className="text-[9px] font-bold px-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            Late
                          </span>
                        )}
                        {day.isHalfDay && (
                          <span className="text-[9px] font-bold px-1 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                            {day.halfDaySlot || 'Half Day'}
                          </span>
                        )}
                        {day.departureTag === 'Early' && !day.isHalfDay && (
                          <span className="text-[9px] font-bold px-1 rounded bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
                            Early
                          </span>
                        )}
                        {day.otMinutes > 0 && (
                          <span className="text-[9px] font-bold px-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                            +{day.otMinutes}m OT
                          </span>
                        )}
                        {day.dataAnomaly && (
                          <span className="text-[9px] font-bold px-1 rounded bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-800 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Anomaly
                          </span>
                        )}
                      </div>

                      {/* Rich Hover Popover */}
                      {isHovered && !editingDay && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 shadow-2xl z-30 text-xs pointer-events-none animate-in fade-in zoom-in-95">
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                            <span>Day {day.day} &bull; {day.dow}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{day.date}</span>
                          </div>

                          <div className="space-y-1.5 pt-2 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400">Status:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{statusText}</span>
                            </div>

                            {day.status === 'P' && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 dark:text-slate-400">In-Time:</span>
                                  <span className="font-mono text-slate-800 dark:text-slate-200">
                                    {day.in ? (day.inMinutes !== null ? minutesTo12HourString(day.inMinutes) : day.in) : 'None'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 dark:text-slate-400">Arrival Tag:</span>
                                  <span className={`font-semibold ${day.arrivalTag === 'Late' || day.arrivalTag === 'VeryLate' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {day.arrivalTag || 'On-Time'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 dark:text-slate-400">Out-Time:</span>
                                  <span className="font-mono text-slate-800 dark:text-slate-200">
                                    {day.out ? (day.outMinutes !== null ? minutesTo12HourString(day.outMinutes) : day.out) : 'None'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 dark:text-slate-400">Departure Tag:</span>
                                  <span className={`font-semibold ${day.departureTag === 'Early' ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {day.departureTag || 'On-Time'}
                                  </span>
                                </div>
                                {day.isHalfDay && (
                                  <div className="flex justify-between text-purple-600 dark:text-purple-400 font-semibold">
                                    <span>Half Day:</span>
                                    <span>{day.halfDaySlot} (-0.5d)</span>
                                  </div>
                                )}
                                {day.otMinutes > 0 && (
                                  <div className="flex justify-between text-blue-600 dark:text-blue-400 font-semibold">
                                    <span>Overtime:</span>
                                    <span>+{day.otMinutes} mins</span>
                                  </div>
                                )}
                              </>
                            )}

                            {day.dataAnomaly && (
                              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-violet-700 dark:text-violet-300 font-semibold">
                                &bull; {day.anomalyReason}
                              </div>
                            )}

                            {day.edited && (
                              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-amber-700 dark:text-amber-300 font-medium">
                                <span className="font-bold">Manual Reason:</span> {day.editReason || 'Manually updated'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Tabular Daily Log Table */}
        {activeView === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Day</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">DOW</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">In Time</th>
                  <th className="py-2.5 px-3 text-center">Arrival</th>
                  <th className="py-2.5 px-3 text-center">Out Time</th>
                  <th className="py-2.5 px-3 text-center">Departure</th>
                  <th className="py-2.5 px-3 text-center">Half Day</th>
                  <th className="py-2.5 px-3 text-center">OT (Mins)</th>
                  <th className="py-2.5 px-3">Flags / Reason</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                {employee.days.map(day => (
                  <tr key={day.day} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                      <span>{day.day}</span>
                      {day.edited && (
                        <span title={day.editReason || 'Manually edited'} className="text-amber-600 dark:text-amber-400">
                          <Pencil className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{day.date}</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{day.dow}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          day.status === 'P'
                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60'
                            : day.status === 'A'
                            ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/60'
                            : day.status === 'L'
                            ? 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60'
                            : day.status === 'WO'
                            ? 'text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {day.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-800 dark:text-slate-200">{day.in || '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      {day.arrivalTag === 'Late' || day.arrivalTag === 'VeryLate' ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{day.arrivalTag}</span>
                      ) : day.arrivalTag ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{day.arrivalTag}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-800 dark:text-slate-200">{day.out || '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      {day.departureTag === 'Early' || day.departureTag === 'VeryEarly' ? (
                        <span className="text-orange-600 dark:text-orange-400 font-bold">{day.departureTag}</span>
                      ) : day.departureTag ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{day.departureTag}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {day.isHalfDay ? (
                        <span className="text-purple-600 dark:text-purple-400 font-bold">{day.halfDaySlot}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                      {day.otMinutes > 0 ? `+${day.otMinutes}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-xs">
                      {day.dataAnomaly ? (
                        <span className="text-violet-700 dark:text-violet-300 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-violet-600 dark:text-violet-400 shrink-0" />
                          <span>{day.anomalyReason}</span>
                        </span>
                      ) : day.edited ? (
                        <span className="text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
                          <Pencil className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>{day.editReason || 'Edited'}</span>
                        </span>
                      ) : day.autoSundayWO ? (
                        <span className="text-slate-400 dark:text-slate-500 italic">Auto Sunday WO</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => startEditing(day)}
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-sans transition flex items-center gap-1 mx-auto border border-slate-200 dark:border-slate-700 shadow-sm"
                        title="Edit day record"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inline Edit Popover / Floating Dialog */}
      {editingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 transition-colors">
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Edit Attendance — Day {editingDay.day} ({editingDay.dow})
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {employee.name} &bull; Shift: {employee.shift} ({minutesTo12HourString(employee.shiftStart)} - {minutesTo12HourString(employee.shiftEnd)})
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelEdit}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Status Dropdown */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as DayStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="P">Present (P)</option>
                  <option value="A">Absent (A)</option>
                  <option value="L">Leave (L)</option>
                  <option value="WO">Weekly Off (WO)</option>
                  <option value="NA">Not Applicable (NA)</option>
                </select>
              </div>

              {/* In-Time and Out-Time (only when status is P) */}
              {editStatus === 'P' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">In-Time (HH:MM)</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:05"
                      value={editIn}
                      onChange={e => setEditIn(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Out-Time (HH:MM)</label>
                    <input
                      type="text"
                      placeholder="e.g. 19:05"
                      value={editOut}
                      onChange={e => setEditOut(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Manual Classification Override Dropdown */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Manual Classification Override</label>
                  <span className="text-[10px] text-slate-500">Overrides Step-4 automatic logic</span>
                </div>
                <select
                  value={editOverride}
                  onChange={e => setEditOverride(e.target.value as ManualOverrideType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="auto">Auto (computed)</option>
                  <option value="on_time">On-time</option>
                  <option value="late">Late</option>
                  <option value="half_day_slot_1">Half Day — Slot 1</option>
                  <option value="half_day_slot_2">Half Day — Slot 2</option>
                  <option value="early_leave">Early Leave</option>
                  <option value="anomaly">Data Anomaly (ignore in calculations)</option>
                </select>
              </div>

              {/* Reason for Change */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Reason for change {editOverride !== 'auto' && <span className="text-amber-600 dark:text-amber-400 font-bold">* (Required)</span>}
                  </label>
                </div>
                <textarea
                  rows={2}
                  placeholder={editOverride !== 'auto' ? 'Required: Enter explanation for manual override...' : 'Optional comment or reason...'}
                  value={editReason}
                  onChange={e => {
                    setEditReason(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none ${
                    editOverride !== 'auto' && !editReason.trim() ? 'border-amber-500 dark:border-amber-700/80 bg-amber-50/50 dark:bg-amber-950/10' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>

              {/* Error Message */}
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
