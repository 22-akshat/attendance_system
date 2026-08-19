import React, { useState, useMemo } from 'react';
import { Employee, ParsedMonthData } from '../types/attendance';
import {
  Users,
  Percent,
  TrendingDown,
  TrendingUp,
  Award,
  ArrowUp,
  ArrowDown,
  Download,
  Search,
  ChevronRight,
  BarChart3,
  Edit3
} from 'lucide-react';
import { exportSummaryToExcel } from '../utils/exportUtils';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface OverviewDashboardProps {
  data: ParsedMonthData;
  onSelectEmployee: (empId: string) => void;
}

type SortField =
  | 'sNo'
  | 'name'
  | 'designation'
  | 'shift'
  | 'attendanceRatePct'
  | 'lateCount'
  | 'earlyCount'
  | 'halfDayCount'
  | 'totalOtMinutes'
  | 'totalDeductionDays'
  | 'netDaysAdjustment';

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  data,
  onSelectEmployee,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [sortField, setSortField] = useState<SortField>('sNo');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'deductions' | 'ot' | 'anomalies' | 'edited'>('all');
  const [search, setSearch] = useState('');
  const [showCharts, setShowCharts] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for metrics
    }
  };

  // Filtered & Sorted Employees
  const processedEmployees = useMemo(() => {
    let list = [...data.employees];

    // Filter
    if (filterType === 'deductions') {
      list = list.filter(e => e.summary.totalDeductionDays > 0);
    } else if (filterType === 'ot') {
      list = list.filter(e => e.summary.otDaysEarned > 0);
    } else if (filterType === 'anomalies') {
      list = list.filter(e => e.summary.anomalyCount > 0);
    } else if (filterType === 'edited') {
      list = list.filter(e => (e.summary.editedCount || 0) > 0);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        e =>
          e.name.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q) ||
          e.shift.toLowerCase().includes(q) ||
          (e.note && e.note.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === 'sNo') {
        valA = Number(a.sNo) || 0;
        valB = Number(b.sNo) || 0;
      } else if (sortField === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortField === 'designation') {
        valA = a.designation.toLowerCase();
        valB = b.designation.toLowerCase();
      } else if (sortField === 'shift') {
        valA = a.shift.toLowerCase();
        valB = b.shift.toLowerCase();
      } else if (sortField === 'totalOtMinutes') {
        valA = a.summary.totalOtMinutes;
        valB = b.summary.totalOtMinutes;
      } else {
        valA = a.summary[sortField as keyof typeof a.summary] ?? 0;
        valB = b.summary[sortField as keyof typeof b.summary] ?? 0;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [data.employees, filterType, search, sortField, sortAsc]);

  // Chart data: Net adjustments by employee (top 10 with deductions or OT)
  const chartData = useMemo(() => {
    return data.employees
      .slice(0, 10)
      .map(emp => ({
        name: emp.name.split(' ')[0],
        Deductions: emp.summary.totalDeductionDays,
        'OT Days': emp.summary.otDaysEarned,
        'Net Adj': emp.summary.netDaysAdjustment,
      }));
  }, [data.employees]);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-5 md:space-y-6 max-w-7xl mx-auto w-full transition-colors">
      {/* 4 Summary Cards Above Table */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Employees */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Workforce</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {data.stats.totalEmployees}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">employees</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Present days logged:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{data.stats.totalPresentCount}</span>
          </div>
        </div>

        {/* Card 2: Average Attendance % */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Attendance</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {data.stats.avgAttendancePct}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">monthly rate</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Absent / Leave:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {data.stats.totalAbsentCount} A &bull; {data.stats.totalLeaveCount} L
            </span>
          </div>
        </div>

        {/* Card 3: Total Org Deduction Days */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Deductions</span>
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">
              -{data.stats.totalOrgDeductionDays.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">days org-wide</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Rules:</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">Late &gt; 3, Early &gt; 3, Half-days</span>
          </div>
        </div>

        {/* Card 4: Total OT Days Earned */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total OT Days Earned</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              +{data.stats.totalOrgOtDaysEarned}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">days credited</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Total OT Time:</span>
            <span className="font-bold text-cyan-600 dark:text-cyan-300">{data.stats.totalOrgOtHours} hours</span>
          </div>
        </div>
      </div>

      {/* Visual Chart Collapsible */}
      {showCharts && (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Monthly Adjustment Comparison (Deductions vs OT Credit Days)
              </h2>
            </div>
            <button
              onClick={() => setShowCharts(false)}
              className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Hide Chart
            </button>
          </div>
          <div className="h-44 sm:h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a'
                  }}
                  itemStyle={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Bar dataKey="Deductions" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="OT Days" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Overview Table Section */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
        {/* Table Filter & Header Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Filter table..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-56"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/60 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] overflow-x-auto no-scrollbar">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-0.5 rounded-md font-medium transition whitespace-nowrap ${
                  filterType === 'all'
                    ? 'bg-slate-900 dark:bg-slate-800 text-white font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                All ({data.employees.length})
              </button>
              <button
                onClick={() => setFilterType('deductions')}
                className={`px-2.5 py-0.5 rounded-md font-medium transition whitespace-nowrap ${
                  filterType === 'deductions'
                    ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400'
                }`}
              >
                Deductions
              </button>
              <button
                onClick={() => setFilterType('ot')}
                className={`px-2.5 py-0.5 rounded-md font-medium transition whitespace-nowrap ${
                  filterType === 'ot'
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                OT Earners
              </button>
              {data.stats.totalAnomaliesCount > 0 && (
                <button
                  onClick={() => setFilterType('anomalies')}
                  className={`px-2.5 py-0.5 rounded-md font-medium transition whitespace-nowrap ${
                    filterType === 'anomalies'
                      ? 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400'
                  }`}
                >
                  Anomalies ({data.stats.totalAnomaliesCount})
                </button>
              )}
              {data.stats.totalEditedCount > 0 && (
                <button
                  onClick={() => setFilterType('edited')}
                  className={`px-2.5 py-0.5 rounded-md font-medium transition flex items-center gap-1 whitespace-nowrap ${
                    filterType === 'edited'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
                  }`}
                >
                  <Edit3 className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                  <span>Edited ({data.stats.totalEditedCount})</span>
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => exportSummaryToExcel(data)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition shrink-0 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Table (.xlsx)</span>
          </button>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold select-none">
                <th
                  onClick={() => handleSort('sNo')}
                  className="py-3 px-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 text-center w-12"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>#</span>
                    {sortField === 'sNo' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />)}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 min-w-[180px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Employee Name</span>
                    {sortField === 'name' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />)}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('designation')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    <span>Designation</span>
                    {sortField === 'designation' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />)}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('shift')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    <span>Shift</span>
                    {sortField === 'shift' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />)}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('attendanceRatePct')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Present / Rate</span>
                    {sortField === 'attendanceRatePct' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />)}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('lateCount')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 text-center"
                  title="Late Arrivals (first 3 free, then 1 day deduction per late)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Late</span>
                    {sortField === 'lateCount' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />)}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('earlyCount')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 text-center"
                  title="Early Departures (first 3 free, then 1 day deduction per early)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Early</span>
                    {sortField === 'earlyCount' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />)}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('halfDayCount')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 text-center"
                  title="Half Days (0.5 day deduction each, no free allowance)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Half Day</span>
                    {sortField === 'halfDayCount' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />)}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('totalOtMinutes')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 text-center"
                  title="Total OT Hours & Earned Days"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>OT Hours</span>
                    {sortField === 'totalOtMinutes' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />)}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('totalDeductionDays')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 text-center"
                  title="Total Deduction Days (Late + Early + Half-day)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Deduction</span>
                    {sortField === 'totalDeductionDays' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />)}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('netDaysAdjustment')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 text-center"
                  title="Net Adjustment: OT Days Earned - Total Deduction Days"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Net Adj</span>
                    {sortField === 'netDaysAdjustment' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />)}
                  </div>
                </th>

                <th className="py-3 px-3 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {processedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500">
                    No matching employee records found.
                  </td>
                </tr>
              ) : (
                processedEmployees.map(emp => {
                  const net = emp.summary.netDaysAdjustment;
                  const isNegative = net < 0;
                  const isPositive = net > 0;

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => onSelectEmployee(emp.id)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition group"
                    >
                      <td className="py-3 px-3.5 text-center text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                        {emp.sNo}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition">
                            {emp.name}
                          </div>
                          {emp.summary.editedCount > 0 && (
                            <span
                              title={`${emp.summary.editedCount} day(s) manually edited`}
                              className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-0.5"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>{emp.summary.editedCount} Edited</span>
                            </span>
                          )}
                          {emp.summary.anomalyCount > 0 && (
                            <span
                              title={`${emp.summary.anomalyCount} data anomaly flagged`}
                              className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-800"
                            >
                              Anomaly
                            </span>
                          )}
                        </div>
                        {emp.note && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400/90 italic truncate max-w-[200px]">
                            {emp.note}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        {emp.designation}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                          {emp.shift}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="font-bold text-slate-900 dark:text-slate-200">
                          {emp.summary.present}/{emp.summary.workingDays}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {emp.summary.attendanceRatePct}%
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-semibold ${
                            emp.summary.lateCount > 3 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {emp.summary.lateCount}
                        </span>
                        {emp.summary.lateDeductionDays > 0 && (
                          <span className="text-[10px] text-red-600 dark:text-red-400 ml-1">
                            (-{emp.summary.lateDeductionDays}d)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-semibold ${
                            emp.summary.earlyCount > 3 ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {emp.summary.earlyCount}
                        </span>
                        {emp.summary.earlyDeductionDays > 0 && (
                          <span className="text-[10px] text-orange-600 dark:text-orange-400 ml-1">
                            (-{emp.summary.earlyDeductionDays}d)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {emp.summary.halfDayCount > 0 ? (
                          <span className="text-purple-600 dark:text-purple-400 font-bold">
                            {emp.summary.halfDayCount}
                            <span className="text-[10px] ml-1">(-{emp.summary.halfDayDeductionDays}d)</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-mono">
                        <div className="text-slate-900 dark:text-slate-100">{(emp.summary.totalOtMinutes / 60).toFixed(1)}h</div>
                        {emp.summary.otDaysEarned > 0 && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                            +{emp.summary.otDaysEarned}d earned
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {emp.summary.totalDeductionDays > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/70 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 font-bold font-mono text-[11px]">
                            -{emp.summary.totalDeductionDays.toFixed(1)}d
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-mono">0d</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md font-bold font-mono text-xs ${
                            isNegative
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/80'
                              : isPositive
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {isPositive ? `+${net}d` : isNegative ? `${net}d` : '0d'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition inline-block" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
