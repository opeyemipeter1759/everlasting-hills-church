"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AnalyticsFilterBar } from "../AnalyticsFilterBar";
import { AnalyticsStatCards } from "../sections/AnalyticsStatCards";
import { ChartSkeleton } from "@/components/ui/display/SkeletonBlock";
import { Leaderboard } from "../sections/Leaderboard";
import { ServiceHealthPanel } from "../sections/ServiceHealthPanel";
import { RetentionCard } from "../sections/RetentionCard";
import { FirstTimersPanel } from "../sections/FirstTimersPanel";
import { ConsistencyTable } from "../sections/ConsistencyTable";
import { PeriodComparison } from "../sections/PeriodComparison";
import { AlertsPanel } from "../sections/AlertsPanel";
import type { AnalyticsFilter } from "@/lib/api/analytics";

const DEFAULT_FILTER: AnalyticsFilter = { period: "week", serviceType: "all" };

// recharts is a heavy dependency (~90kB) only needed once these charts actually
// render — dynamic-importing each keeps it out of every other dashboard route's bundle.
const chartLoading = () => <ChartSkeleton />;
const AttendanceTrendChart = dynamic(() => import("../charts/AttendanceTrendChart").then((m) => m.AttendanceTrendChart), { ssr: false, loading: chartLoading });
const PresentAbsentDonut = dynamic(() => import("../charts/DonutChart").then((m) => m.PresentAbsentDonut), { ssr: false, loading: chartLoading });
const ServiceComparisonChart = dynamic(() => import("../charts/ServiceComparisonChart").then((m) => m.ServiceComparisonChart), { ssr: false, loading: chartLoading });
const RateLineChart = dynamic(() => import("../charts/RateLineChart").then((m) => m.RateLineChart), { ssr: false, loading: chartLoading });
const AbsenteeTrendChart = dynamic(() => import("../charts/AbsenteeTrendChart").then((m) => m.AbsenteeTrendChart), { ssr: false, loading: chartLoading });
const PeakHoursChart = dynamic(() => import("../charts/PeakHoursChart").then((m) => m.PeakHoursChart), { ssr: false, loading: chartLoading });
const HeatmapChart = dynamic(() => import("../charts/HeatmapChart").then((m) => m.HeatmapChart), { ssr: false, loading: chartLoading });
const MemberGrowthChart = dynamic(() => import("../charts/MemberGrowthChart").then((m) => m.MemberGrowthChart), { ssr: false, loading: chartLoading });

export default function AttendaceAnalytic() {
  const [pending, setPending] = useState<AnalyticsFilter>(DEFAULT_FILTER);
  // Debounce 400 ms so fast pill-clicks or date picker changes don't fire 16
  // requests per interaction — all hooks share the same stable filter object.
  const [filter, setFilter] = useState<AnalyticsFilter>(DEFAULT_FILTER);
  useEffect(() => {
    const t = setTimeout(() => setFilter(pending), 400);
    return () => clearTimeout(t);
  }, [pending]);

  return (
    <div className="space-y-5 pb-10">
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-black text-gray-900 dark:text-white">Attendance Analytics</h1>
          <p className="text-xs text-gray-400 mt-0.5">All charts update when you change the filter</p>
        </div>
        <AnalyticsFilterBar value={pending} onChange={setPending} />
      </div>

      <AnalyticsStatCards filter={filter} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2"><AttendanceTrendChart filter={filter} /></div>
        <PresentAbsentDonut filter={filter} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ServiceComparisonChart filter={filter} />
        <RateLineChart filter={filter} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AbsenteeTrendChart filter={filter} />
        <PeakHoursChart filter={filter} />
      </div>

      <HeatmapChart serviceType={filter.serviceType} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2"><MemberGrowthChart filter={filter} /></div>
        <RetentionCard filter={filter} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2"><Leaderboard filter={filter} /></div>
        <ServiceHealthPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <FirstTimersPanel filter={filter} />
        <div className="lg:col-span-2"><ConsistencyTable filter={filter} /></div>
      </div>

      <PeriodComparison />
      <AlertsPanel />
    </div>
  );
}
