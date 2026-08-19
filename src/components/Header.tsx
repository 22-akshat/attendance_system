import React from 'react';
import { ParsedMonthData } from '../types/attendance';
import { Building2, Calendar, Download, RefreshCw, BookOpen, AlertCircle, Edit3 } from 'lucide-react';
import { exportSummaryToExcel } from '../utils/exportUtils';

interface HeaderProps {
  data: ParsedMonthData | null;
  onReplaceFile: () => void;
  onOpenPolicy: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  data,
  onReplaceFile,
  onOpenPolicy,
}) => {
  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 md:px-6 flex items-center justify-between z-20 shrink-0">
      {/* Left: Brand & Month Tag */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-md shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-bold text-slate-100 tracking-tight leading-tight">
                Frost Free Ventures
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Pvt Ltd
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none">Attendance Operations &amp; Rollup Engine</p>
          </div>
        </div>

        {data && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-slate-100">{data.monthLabel}</span>
            <span className="text-[10px] text-slate-400">({data.totalDaysInMonth} Days)</span>
          </div>
        )}
      </div>

      {/* Right: Quick Stats & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {data && (
          <>
            {/* Manually Edited pill if any */}
            {data.stats.totalEditedCount > 0 && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-700/50 text-[11px] font-medium text-amber-300">
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>{data.stats.totalEditedCount} Manually Edited</span>
              </div>
            )}

            {/* Anomaly pill if any */}
            {data.stats.totalAnomaliesCount > 0 && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-950/50 border border-violet-700/50 text-[11px] font-medium text-violet-300">
                <AlertCircle className="w-3.5 h-3.5 text-violet-400" />
                <span>{data.stats.totalAnomaliesCount} Anomalies Flagged</span>
              </div>
            )}

            {/* Export Summary Button */}
            <button
              onClick={() => exportSummaryToExcel(data)}
              title="Export monthly summary to Excel"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export XLSX</span>
            </button>
          </>
        )}

        {/* Policy Reference Modal Trigger */}
        <button
          onClick={onOpenPolicy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-slate-100 transition"
          title="View company attendance policies & formulas"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Policy Rules</span>
        </button>

        {/* Replace File Button */}
        {data && (
          <button
            onClick={onReplaceFile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-medium transition shadow-md shadow-indigo-600/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Replace File</span>
          </button>
        )}
      </div>
    </header>
  );
};
