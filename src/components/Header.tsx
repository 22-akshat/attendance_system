import React from 'react';
import { ParsedMonthData } from '../types/attendance';
import {
  Building2,
  Calendar,
  Download,
  RefreshCw,
  BookOpen,
  AlertCircle,
  Edit3,
  Sun,
  Moon,
  Users
} from 'lucide-react';
import { exportSummaryToExcel } from '../utils/exportUtils';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  data: ParsedMonthData | null;
  onReplaceFile: () => void;
  onOpenPolicy: () => void;
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  data,
  onReplaceFile,
  onOpenPolicy,
  onToggleMobileSidebar,
  isMobileSidebarOpen,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white/95 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 md:px-6 flex items-center justify-between z-20 shrink-0 transition-colors">
      {/* Left: Brand, Month Tag & Mobile Sidebar Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        {data && onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className={`lg:hidden p-2 rounded-xl border transition flex items-center justify-center ${
              isMobileSidebarOpen
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Toggle Staff Directory"
            aria-label="Toggle Staff Directory"
          >
            <Users className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-md shadow-indigo-500/20 shrink-0">
            <div className="w-full h-full bg-slate-900 dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight whitespace-nowrap">
                Frost Free Ventures
              </h1>
              <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Pvt Ltd
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-none hidden xs:block">
              Attendance Operations &amp; Rollup
            </p>
          </div>
        </div>

        {data && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">{data.monthLabel}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">({data.totalDaysInMonth} Days)</span>
          </div>
        )}
      </div>

      {/* Right: Quick Stats, Theme Toggle & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
        {data && (
          <>
            {/* Manually Edited pill if any */}
            {data.stats.totalEditedCount > 0 && (
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/50 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{data.stats.totalEditedCount} Edited</span>
              </div>
            )}

            {/* Anomaly pill if any */}
            {data.stats.totalAnomaliesCount > 0 && (
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-950/50 border border-violet-300 dark:border-violet-700/50 text-[11px] font-medium text-violet-800 dark:text-violet-300">
                <AlertCircle className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span>{data.stats.totalAnomaliesCount} Anomalies</span>
              </div>
            )}

            {/* Export Summary Button */}
            <button
              onClick={() => exportSummaryToExcel(data)}
              title="Export monthly summary to Excel (.xlsx)"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Export XLSX</span>
            </button>
          </>
        )}

        {/* Policy Reference Modal Trigger */}
        <button
          onClick={onOpenPolicy}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition"
          title="View company attendance policies & formulas"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden md:inline">Policy Rules</span>
        </button>

        {/* Theme Toggle Button (Light / Dark mode) */}
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-amber-400 transition shadow-sm flex items-center justify-center"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 transition-transform rotate-0 hover:-rotate-12" />
          )}
        </button>

        {/* Replace File Button */}
        {data && (
          <button
            onClick={onReplaceFile}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20"
            title="Upload a new attendance file"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Replace File</span>
          </button>
        )}
      </div>
    </header>
  );
};
