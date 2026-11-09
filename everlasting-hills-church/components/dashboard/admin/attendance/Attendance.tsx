"use client";
import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { LiveSessionBanner } from "./LiveSessionBanner";
import { TodayFeed } from "./TodayFeed";
import { ReportsSection } from "./ReportsSection";
import ServiceOverview from "./overview/ServiceOverview";
import { defaultService } from "./overview/overview-data";
import AttendanceRoll from "./roll/AttendanceRoll";
import AttendanceTabs, { panelId, tabId, type AttendanceTab } from "./AttendanceTabs";
import AttendanceInsights from "./insights/AttendanceInsights";
import { isOneService } from "./roll/roll-query";
import { useServiceOverview } from "@/lib/api/attendance-roll";
import { useTodayFeed } from "@/lib/api";

const SUBTITLE: Record<AttendanceTab, string> = {
  attendance: "Who came to each service, from the ushers' count and members' check-ins",
  insights: "How attendance is moving, and the members who need checking on",
};

export default function Attendance() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const tab: AttendanceTab = useSearchParams().get("tab") === "insights" ? "insights" : "attendance";
  // Insights loads its charts the first time it is opened, then stays mounted so switching back is instant.
  const [insightsOpened, setInsightsOpened] = useState(tab === "insights");
  useEffect(() => {
    if (tab === "insights") setInsightsOpened(true);
  }, [tab]);

  const [spinning, setSpinning] = useState(false);
  const overview = useServiceOverview(24);
  const todayFeed = useTodayFeed();
  const services = overview.data?.services ?? [];
  // The overview and the roll follow one service until the roll is widened to
  // every Sunday (or every service); then the overview keeps its own.
  const [focusId, setFocusId] = useState<string | null>(null);
  const [scope, setScope] = useState<string | null>(null);
  const shownId = focusId ?? defaultService(services)?.id ?? null;

  const refresh = useCallback(async () => {
    setSpinning(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setSpinning(false), 600);
  }, [queryClient]);

  function changeTab(next: AttendanceTab) {
    router.replace(next === "insights" ? `${pathname}?tab=insights` : pathname, { scroll: false });
  }

  function showService(id: string) {
    setFocusId(id);
    setScope(id);
  }

  function changeScope(next: string) {
    setScope(next);
    if (isOneService(next)) setFocusId(next);
  }

  return (
    <div className="space-y-5 max-w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Attendance</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{SUBTITLE[tab]}</p>
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
      <AttendanceTabs value={tab} onChange={changeTab} />

      <div id={panelId("attendance")} role="tabpanel" aria-labelledby={tabId("attendance")} hidden={tab !== "attendance"} className="space-y-5">
        <LiveSessionBanner />
        {overview.isLoading ? (
          <div className="h-80 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#1c1c1e]" aria-label="Loading the last service" />
        ) : overview.data && shownId ? (
          <ServiceOverview data={overview.data} selectedId={shownId} onSelect={showService} />
        ) : (
          <p className="rounded-2xl border border-dashed border-gray-300 px-5 py-8 text-center text-sm text-gray-500 dark:border-white/15 dark:text-white/50">
            {overview.isError ? "The service overview couldn't load. Refresh to try again." : "No services have been held yet."}
          </p>
        )}
        {!overview.isLoading && <AttendanceRoll scope={scope ?? shownId ?? "all"} onScopeChange={changeScope} services={services} />}
        {/* The live check-in feed only means something on a day with a service. */}
        {todayFeed.data?.sessionId && <TodayFeed />}
        <ReportsSection />
      </div>

      <div id={panelId("insights")} role="tabpanel" aria-labelledby={tabId("insights")} hidden={tab !== "insights"}>
        {insightsOpened && <AttendanceInsights services={services} />}
      </div>
    </div>
  );
}
