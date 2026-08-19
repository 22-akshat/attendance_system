import React, { useState, useMemo } from 'react';
import { Employee, ParsedMonthData } from '../types/attendance';
import {
  Users,
  Search,
  Upload,
  Calendar,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Edit3
} from 'lucide-react';

interface SidebarProps {
  data: ParsedMonthData;
  selectedEmployeeId: string | null;
  onSelectEmployee: (empId: string | null) => void;
  onReplaceFile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  data,
  selectedEmployeeId,
  onSelectEmployee,
  onReplaceFile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'deductions' | 'ot' | 'anomalies' | 'edited'>('all');

  // Filter employees by search and category
  const filteredEmployees = useMemo(() => {
    let emps = data.employees;

    // Filter by category
    if (activeFilter === 'deductions') {
      emps = emps.filter(e => e.summary.totalDeductionDays > 0 || e.summary.netDaysAdjustment < 0);
    } else if (activeFilter === 'ot') {
      emps = emps.filter(e => e.summary.otDaysEarned > 0 || e.summary.netDaysAdjustment > 0);
    } else if (activeFilter === 'anomalies') {
      emps = emps.filter(e => e.summary.anomalyCount > 0);
    } else if (activeFilter === 'edited') {
      emps = emps.filter(e => (e.summary.editedCount || 0) > 0);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      emps = emps.filter(
        e =>
          e.name.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q) ||
          (e.note && e.note.toLowerCase().includes(q)) ||
          e.shift.toLowerCase().includes(q)
      );
    }

    return emps;
  }, [data.employees, searchQuery, activeFilter]);

  // Helper for initial letters
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <aside className="w-full lg:w-80 xl:w-96 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 h-[calc(100vh-4rem)] select-none">
      {/* Top Section: Month & Search */}
      <div className="p-4 border-b border-slate-800 space-y-3 shrink-0">
        {/* Month Banner */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <span>{data.monthLabel}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                  {data.employees.length} Staff
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{data.fileName}</p>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, role, shift..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300 font-mono bg-slate-800 px-1 rounded"
            >
              ESC
            </button>
          )}
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-md transition font-medium whitespace-nowrap flex items-center gap-1 ${
              activeFilter === 'all'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            All ({data.employees.length})
          </button>
          <button
            onClick={() => setActiveFilter('deductions')}
            className={`px-2.5 py-1 rounded-md transition font-medium whitespace-nowrap flex items-center gap-1 ${
              activeFilter === 'deductions'
                ? 'bg-red-950 text-red-300 border border-red-800/50'
                : 'text-slate-400 hover:text-red-400 hover:bg-slate-800/40'
            }`}
          >
            <TrendingDown className="w-3 h-3 text-red-400" />
            <span>Deductions</span>
          </button>
          <button
            onClick={() => setActiveFilter('ot')}
            className={`px-2.5 py-1 rounded-md transition font-medium whitespace-nowrap flex items-center gap-1 ${
              activeFilter === 'ot'
                ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800/40'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-blue-400" />
            <span>OT Credit</span>
          </button>
          {data.stats.totalAnomaliesCount > 0 && (
            <button
              onClick={() => setActiveFilter('anomalies')}
              className={`px-2.5 py-1 rounded-md transition font-medium whitespace-nowrap flex items-center gap-1 ${
                activeFilter === 'anomalies'
                  ? 'bg-violet-950 text-violet-300 border border-violet-800/50'
                  : 'text-slate-400 hover:text-violet-400 hover:bg-slate-800/40'
              }`}
            >
              <AlertCircle className="w-3 h-3 text-violet-400" />
              <span>Anomalies ({data.stats.totalAnomaliesCount})</span>
            </button>
          )}
          {data.stats.totalEditedCount > 0 && (
            <button
              onClick={() => setActiveFilter('edited')}
              className={`px-2.5 py-1 rounded-md transition font-medium whitespace-nowrap flex items-center gap-1 ${
                activeFilter === 'edited'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/40'
              }`}
            >
              <Edit3 className="w-3 h-3 text-amber-400" />
              <span>Manually edited ({data.stats.totalEditedCount})</span>
            </button>
          )}
        </div>

        {/* All Employees Overview Toggle */}
        <button
          onClick={() => onSelectEmployee(null)}
          className={`w-full p-2.5 rounded-xl border transition flex items-center justify-between text-left ${
            selectedEmployeeId === null
              ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-200'
              : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${
              selectedEmployeeId === null ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">All Employees Overview</div>
              <div className="text-[10px] text-slate-400">Org rollup &amp; comparative table</div>
            </div>
          </div>
          {selectedEmployeeId === null && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Active
            </span>
          )}
        </button>
      </div>

      {/* Middle: Scrollable Employee List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2 space-y-1">
        {filteredEmployees.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <UserCheck className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs font-semibold text-slate-400">No employees match filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="text-[11px] text-indigo-400 hover:underline"
            >
              Clear search &amp; filters
            </button>
          </div>
        ) : (
          filteredEmployees.map(emp => {
            const isSelected = selectedEmployeeId === emp.id;
            const netAdj = emp.summary.netDaysAdjustment;
            const isNegative = netAdj < 0;
            const isPositive = netAdj > 0;

            return (
              <button
                key={emp.id}
                onClick={() => onSelectEmployee(emp.id)}
                className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/30 border-transparent hover:bg-slate-800/50 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Initials Avatar */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {getInitials(emp.name)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-200 truncate">{emp.name}</span>
                      {emp.summary.editedCount > 0 && (
                        <span
                          title={`${emp.summary.editedCount} day(s) manually edited`}
                          className="px-1 py-0.2 text-[8px] font-bold rounded bg-amber-950 text-amber-300 border border-amber-800/60 flex items-center gap-0.5"
                        >
                          <Edit3 className="w-2 h-2" />
                          <span>{emp.summary.editedCount}</span>
                        </span>
                      )}
                      {emp.summary.anomalyCount > 0 && (
                        <span
                          title={`${emp.summary.anomalyCount} data anomaly flagged`}
                          className="w-2 h-2 rounded-full bg-violet-400 shrink-0"
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="truncate max-w-[110px]">{emp.designation}</span>
                      <span>&bull;</span>
                      <span className="font-mono text-slate-500">{emp.shift}</span>
                    </div>

                    {emp.note && (
                      <div className="text-[9px] text-amber-400/90 truncate max-w-[160px] italic">
                        {emp.note}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Badges */}
                <div className="flex flex-col items-end shrink-0 gap-1">
                  {/* Net Adjustment Badge */}
                  <span
                    className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      isNegative
                        ? 'bg-red-950/80 text-red-400 border border-red-800/60'
                        : isPositive
                        ? 'bg-blue-950/80 text-blue-400 border border-blue-800/60'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPositive ? `+${netAdj}d` : isNegative ? `${netAdj}d` : '0d'}
                  </span>

                  {/* Attendance Rate */}
                  <span className="text-[10px] font-medium text-slate-400">
                    {emp.summary.attendanceRatePct}%
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Bottom Pinned Action: Upload New Month */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 shrink-0">
        <button
          onClick={onReplaceFile}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm"
        >
          <Upload className="w-4 h-4 text-indigo-400" />
          <span>Upload New Month</span>
        </button>
      </div>
    </aside>
  );
};
