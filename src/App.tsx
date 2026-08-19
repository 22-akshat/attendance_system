import React, { useState } from 'react';
import { DayRecord, DayStatus, ManualOverrideType, ParsedMonthData } from './types/attendance';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { EmployeeDetail } from './components/EmployeeDetail';
import { FileUpload } from './components/FileUpload';
import { PolicyModal } from './components/PolicyModal';
import { extractTimeMinutes } from './utils/timeUtils';
import { computeEmployeeSummary, evaluateDayWithOverride, recalculateMonthStats } from './utils/policyEngine';

export function App() {
  const [data, setData] = useState<ParsedMonthData | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);

  // File replacement handler (wipes previous state and returns to upload screen)
  const handleReplaceFile = () => {
    setData(null);
    setSelectedEmployeeId(null);
  };

  const handleDataLoaded = (newData: ParsedMonthData) => {
    setData(newData);
    setSelectedEmployeeId(null); // default to all-employees overview
  };

  // Handler for manual day record edits and overrides
  const handleUpdateDayRecord = (
    employeeId: string,
    dayNumber: number,
    update: {
      status: DayStatus;
      in: string | null;
      out: string | null;
      manualOverride: ManualOverrideType;
      editReason: string | null;
    }
  ) => {
    setData(prevData => {
      if (!prevData) return null;

      const updatedEmployees = prevData.employees.map(emp => {
        if (emp.id !== employeeId) return emp;

        const updatedDays = emp.days.map(d => {
          if (d.day !== dayNumber) return d;

          let inMinutes: number | null = null;
          let outMinutes: number | null = null;
          let inStr: string | null = null;
          let outStr: string | null = null;

          if (update.status === 'P') {
            if (update.in && update.in.trim()) {
              const parsedIn = extractTimeMinutes(update.in.trim());
              inMinutes = parsedIn.minutes;
              inStr = parsedIn.timeStr || update.in.trim();
            }
            if (update.out && update.out.trim()) {
              const parsedOut = extractTimeMinutes(update.out.trim());
              outMinutes = parsedOut.minutes;
              outStr = parsedOut.timeStr || update.out.trim();
            }
          }

          const isOverridden = update.manualOverride && update.manualOverride !== 'auto';
          const evalResult = evaluateDayWithOverride(
            update.status,
            inMinutes,
            outMinutes,
            emp.shiftWindows,
            update.manualOverride,
            update.editReason || undefined
          );

          const isEdited =
            isOverridden ||
            update.status !== d.status ||
            inStr !== d.in ||
            outStr !== d.out ||
            Boolean(update.editReason);

          const updatedDay: DayRecord = {
            ...d,
            status: update.status,
            in: inStr,
            out: outStr,
            inMinutes,
            outMinutes,
            arrivalTag: evalResult.arrivalTag,
            departureTag: evalResult.departureTag,
            isHalfDay: evalResult.isHalfDay,
            halfDaySlot: evalResult.halfDaySlot,
            otMinutes: evalResult.otMinutes,
            dataAnomaly: evalResult.dataAnomaly,
            anomalyReason: evalResult.anomalyReason,
            edited: isEdited,
            editReason: update.editReason || null,
            manualOverride: update.manualOverride,
          };

          return updatedDay;
        });

        const newSummary = computeEmployeeSummary(updatedDays, emp.shiftWindows);
        return {
          ...emp,
          days: updatedDays,
          summary: newSummary,
        };
      });

      const newStats = recalculateMonthStats(updatedEmployees);

      return {
        ...prevData,
        employees: updatedEmployees,
        stats: newStats,
      };
    });
  };

  // Find currently selected employee
  const selectedEmployee = data?.employees.find(e => e.id === selectedEmployeeId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Global Header */}
      <Header
        data={data}
        onReplaceFile={handleReplaceFile}
        onOpenPolicy={() => setIsPolicyOpen(true)}
      />

      {/* Main Body */}
      {!data ? (
        <FileUpload
          onDataLoaded={handleDataLoaded}
          onOpenPolicy={() => setIsPolicyOpen(true)}
        />
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar
            data={data}
            selectedEmployeeId={selectedEmployeeId}
            onSelectEmployee={empId => setSelectedEmployeeId(empId)}
            onReplaceFile={handleReplaceFile}
          />

          {/* Right Main Content Panel */}
          <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            {selectedEmployee ? (
              <EmployeeDetail
                employee={selectedEmployee}
                monthLabel={data.monthLabel}
                onBack={() => setSelectedEmployeeId(null)}
                onUpdateDayRecord={handleUpdateDayRecord}
              />
            ) : (
              <OverviewDashboard
                data={data}
                onSelectEmployee={empId => setSelectedEmployeeId(empId)}
              />
            )}
          </main>
        </div>
      )}

      {/* Company Policy & Formulas Modal */}
      <PolicyModal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
      />
    </div>
  );
}

export default App;
