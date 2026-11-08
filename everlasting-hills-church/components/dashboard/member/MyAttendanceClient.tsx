"use client";

import { useState } from "react";
import { CalendarCheck, CheckCircle2, TrendingUp, XCircle } from "lucide-react";
import { Pagination } from "@/components/ui/navigation/Pagination";
import { exportCsv } from "./my-attendance/attendance-data";
import { AttendanceTable } from "./my-attendance/AttendanceTable";
import { AttendanceToolbar } from "./my-attendance/AttendanceToolbar";
import { StatChip } from "./my-attendance/StatChip";
import { useMyAttendance } from "./my-attendance/useMyAttendance";

/** The member's own attendance history: totals, then a filterable, exportable table. */
export default function MyAttendanceClient() {
  const attendance = useMyAttendance();
  const { rows, stats } = attendance;
  const [showFilter, setShowFilter] = useState(false);

  return (
    <div className="mx-auto px-2 md:px-4 space-y-5">
      <div>
        <p className="text-[10px] tracking-[0.13em] xs:tracking-[0.25em] uppercase font-bold text-[#87102C] dark:text-[#FFB3C1]">
          Attendance
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[#111] dark:text-white">My Attendance</h1>
        <p className="mt-1 text-sm text-[#555] dark:text-white/50 max-w-xl">
          Your personal attendance history across all church services. Track your overall participation.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip icon={CalendarCheck} label="Total Services" value={stats.total} tone="rose" />
        <StatChip icon={CheckCircle2} label="Present" value={stats.present} tone="emerald" />
        <StatChip icon={XCircle} label="Absent" value={stats.absent} tone="red" />
        <StatChip icon={TrendingUp} label="Attendance Rate" value={`${stats.rate}%`} tone="sky" />
      </div>

      <AttendanceToolbar
        showFilter={showFilter}
        onToggleFilter={() => setShowFilter((v) => !v)}
        count={rows.length}
        onExport={() => exportCsv(rows)}
        onRefresh={() => attendance.refetch()}
        refreshing={attendance.isFetching}
      />

      <AttendanceTable
        rows={attendance.pagedRows}
        loading={attendance.isLoading}
        showFilter={showFilter}
        filters={attendance.filters}
        onFilter={attendance.setFilter}
      />

      <Pagination page={attendance.page} pageCount={attendance.pageCount} onPageChange={attendance.setPage} />
    </div>
  );
}
