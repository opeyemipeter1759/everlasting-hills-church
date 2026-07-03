"use client";
import { useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { LiveSessionBanner } from "./LiveSessionBanner";
import { AttendanceStatCards } from "./AttendanceStatCards";
import { AttendanceTable } from "./AttendanceTable";
import { AtRiskPanel } from "./AtRiskPanel";
import { TodayFeed } from "./TodayFeed";
import { ReportsSection } from "./ReportsSection";
import HeadcountSection from "./headcount/HeadcountSection";

export default function Attendance() {
  const queryClient = useQueryClient();
  const [spinning, setSpinning] = useState(false);

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
      <HeadcountSection />
      <AttendanceTable />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AtRiskPanel />
        <TodayFeed />
      </div>
      <ReportsSection />

    </div>
  );
}
