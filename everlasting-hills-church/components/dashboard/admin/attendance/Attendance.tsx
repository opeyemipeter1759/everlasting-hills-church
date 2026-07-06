"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, Users, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { LiveSessionBanner } from "./LiveSessionBanner";
import { AttendanceStatCards } from "./AttendanceStatCards";
import { AttendanceTable } from "./AttendanceTable";
import { AtRiskPanel } from "./AtRiskPanel";
import { TodayFeed } from "./TodayFeed";
import { ReportsSection } from "./ReportsSection";
import { useTodayHeadcount } from "@/lib/api/headcount";

export default function Attendance() {
  const queryClient = useQueryClient();
  const [spinning, setSpinning] = useState(false);
  const today = useTodayHeadcount();

  const refresh = useCallback(async () => {
    setSpinning(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setSpinning(false), 600);
  }, [queryClient]);

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Attendance</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Manage sessions, track check-ins, and export reports
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={spinning}
          aria-label="Refresh page data"
          title="Refresh all data"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={12} className={spinning ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <LiveSessionBanner />
      <AttendanceStatCards />

      {/* Ushers attendance report — authoritative congregation headcount */}
      <Link
        href="/dashboard/admin/attendance/ushers-report"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-[#87102C]/15 bg-[#87102C]/5 dark:bg-[#87102C]/10 px-5 py-4 transition-all hover:border-[#87102C]/30 hover:bg-[#87102C]/10"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#87102C]/15 text-[#87102C] dark:text-[#e8768a]">
            <Users size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-gray-900 dark:text-white">Ushers Attendance Report</p>
            <p className="text-xs text-gray-500 dark:text-white/50">
              Congregation headcount per service
              {typeof today.data?.total === "number" ? ` · ${today.data.total} counted today` : ""}
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#87102C] dark:text-[#e8768a]">
          View report
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      <AttendanceTable />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AtRiskPanel />
        <TodayFeed />
      </div>
      <ReportsSection />

    </div>
  );
}
