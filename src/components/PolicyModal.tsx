import React from 'react';
import { X, Clock, CheckCircle2, ShieldAlert, Award, Edit3 } from 'lucide-react';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800 p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Frost Free Ventures Attendance Policy</h2>
              <p className="text-xs text-slate-400">Fixed monthly rules, shift window derivations &amp; deduction formulas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-slate-300">
          {/* Section 1: Broken Data Protection */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-violet-400" />
              1. Broken Data &amp; Anomaly Protection (Highest Priority)
            </h3>
            <div className="bg-violet-950/20 border border-violet-800/40 rounded-xl p-3.5 text-xs text-violet-200/90 leading-relaxed space-y-1">
              <p>
                Days marked <strong className="text-white">Present (P)</strong> where <code className="text-violet-300 font-mono">Out &le; In</code> (non-positive duration), missing in/out punches, or total duration <strong className="text-white">&lt; 60 minutes</strong> are immediately flagged as <strong className="text-violet-300">Data Anomalies</strong> for manual review rather than silently forcing incorrect penalties.
              </p>
            </div>
          </div>

          {/* Section 2: Shift Windows */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-indigo-400"></span>
              2. Arrival &amp; Departure Windows (Generic Offset Formula)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Given a shift start time <strong className="text-slate-200 font-mono">S</strong> and end time <strong className="text-slate-200 font-mono">E</strong>, punctuality windows are derived dynamically:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Arrival Windows
                </div>
                <ul className="text-xs space-y-1.5 text-slate-300">
                  <li><strong className="text-slate-100">On-Time:</strong> In-time &le; <code className="text-emerald-300 bg-emerald-950/50 px-1 py-0.5 rounded">S + 15m</code></li>
                  <li><strong className="text-slate-100">Late:</strong> <code className="text-amber-300 bg-amber-950/50 px-1 py-0.5 rounded">S + 16m</code> to <code className="text-amber-300 bg-amber-950/50 px-1 py-0.5 rounded">S + 30m</code></li>
                  <li><strong className="text-slate-100">Very Late:</strong> In-time &gt; <code className="text-red-300 bg-red-950/50 px-1 py-0.5 rounded">S + 30m</code></li>
                </ul>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Departure Windows
                </div>
                <ul className="text-xs space-y-1.5 text-slate-300">
                  <li><strong className="text-slate-100">On-Time:</strong> Out-time &ge; <code className="text-emerald-300 bg-emerald-950/50 px-1 py-0.5 rounded">E - 15m</code></li>
                  <li><strong className="text-slate-100">Early Leave:</strong> Out-time &lt; <code className="text-orange-300 bg-orange-950/50 px-1 py-0.5 rounded">E - 15m</code> (when not a half-day)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: Bidirectional Half-Day Rules */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-purple-400"></span>
              3. Bidirectional Half-Day Classification &amp; Slots
            </h3>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2 text-xs leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="bg-purple-950/30 border border-purple-800/40 rounded-lg p-3 space-y-1">
                  <div className="font-semibold text-purple-300">Case A — Early Departure</div>
                  <div className="text-slate-300">
                    Arrival was on-time or Late (not very late), but worked <strong className="text-white">&lt; 60%</strong> of shift duration.
                  </div>
                  <div className="text-purple-200 font-mono text-[11px] pt-1">Classified as Slot 1 Half Day</div>
                </div>

                <div className="bg-purple-950/30 border border-purple-800/40 rounded-lg p-3 space-y-1">
                  <div className="font-semibold text-purple-300">Case B — Very Late Arrival</div>
                  <div className="text-slate-300">
                    Arrival was Very Late (<code className="text-slate-200">In &gt; S + 30m</code>) AND <code className="text-slate-200">Out &le; S + 210m</code> (3.5h).
                  </div>
                  <div className="text-purple-200 font-mono text-[11px] pt-1">
                    Slot 1 if Out &le; S+195m, else Slot 2
                  </div>
                </div>
              </div>
              <p className="text-slate-400 pt-1">
                * If arrival is very late but out &gt; S + 210m, they stayed long enough and fall into the <strong>Late</strong> bucket instead of half day.
              </p>
            </div>
          </div>

          {/* Section 4: Monthly Deductions */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-red-400"></span>
              4. Monthly Deduction Rules (3 Free Allowance)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1 text-xs">
                <div className="font-bold text-red-400">Late Arrivals</div>
                <div className="text-slate-300 font-mono text-[11px] bg-slate-900 p-1.5 rounded border border-slate-800">
                  max(0, lateCount - 3)
                </div>
                <p className="text-slate-400 text-[11px]">First 3 lates are free per month. Each late after costs 1 full day.</p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1 text-xs">
                <div className="font-bold text-orange-400">Early Departures</div>
                <div className="text-slate-300 font-mono text-[11px] bg-slate-900 p-1.5 rounded border border-slate-800">
                  max(0, earlyCount - 3)
                </div>
                <p className="text-slate-400 text-[11px]">First 3 early leaves are free per month. Each early after costs 1 full day.</p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1 text-xs">
                <div className="font-bold text-purple-400">Half Days</div>
                <div className="text-slate-300 font-mono text-[11px] bg-slate-900 p-1.5 rounded border border-slate-800">
                  halfDayCount * 0.5
                </div>
                <p className="text-slate-400 text-[11px]">Every half day deducts 0.5 days. No free allowance applies.</p>
              </div>
            </div>
          </div>

          {/* Section 5: Overtime Accrual */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-400"></span>
              5. Overtime &amp; Net Day Adjustments
            </h3>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2 text-xs leading-relaxed">
              <div className="flex items-start gap-2">
                <Award className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-100">OT Accrual:</strong> Overtime starts accruing only after <code className="text-blue-300">E + 15m</code>.
                  Daily OT = <code className="text-blue-300 font-mono">max(0, Out - (E + 15m))</code>.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-100">Earning Full OT Days:</strong> Total monthly OT minutes are divided by the employee's shift length (<code className="text-blue-300 font-mono">E - S</code>).
                  <br />
                  <code className="text-slate-200 font-mono">otDaysEarned = Math.floor(totalOtMinutes / shiftDurationMinutes)</code>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between mt-2">
                <span className="font-semibold text-slate-200">Net Monthly Day Adjustment:</span>
                <code className="text-indigo-300 font-bold font-mono text-sm">otDaysEarned - totalDeductionDays</code>
              </div>
            </div>
          </div>

          {/* Section 6: Manual Corrections */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-400" />
              6. Manual Managerial Overrides
            </h3>
            <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3.5 text-xs text-amber-200/90 leading-relaxed">
              Managers can hover any day cell in the calendar or daily log table to edit status, in/out timestamps, or apply a manual classification override with a reason. Overrides win directly in monthly rollups and are visually badged for auditing.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition shadow-lg shadow-indigo-500/20"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
