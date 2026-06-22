"use client";
import { Activity, Users, UserX, Zap, CalendarCheck, Star } from "lucide-react";
import { TrendBadge } from "@/components/ui/display/TrendBadge";
import { StatCardSkeleton } from "@/components/ui/display/SkeletonBlock";
import { useAnalyticsOverview, type AnalyticsFilter } from "@/lib/api/analytics";

function Card({ label, value, sub, trend, icon, accent }: {
  label: string; value: string; sub?: string; trend?: number;
  icon: React.ReactNode; accent: string;
}) {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col gap-1.5 transition-colors">
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accent}`}>{icon}</div>
      </div>
      <p className="text-[28px] font-black text-gray-900 dark:text-white leading-none">{value}</p>
      {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
      {trend !== undefined && <TrendBadge value={trend} />}
    </div>
  );
}

export function AnalyticsStatCards({ filter }: { filter: AnalyticsFilter }) {
  const { data, isLoading } = useAnalyticsOverview(filter);
  if (isLoading || !data) return <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">{Array.from({length:6}).map((_,i)=><StatCardSkeleton key={i}/>)}</div>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      <Card label="Attendance Rate"   value={`${data.attendanceRate}%`}  trend={data.attendanceRateChange}   icon={<Activity size={13} className="text-[#87102C]" />}       accent="bg-[#87102C]/10 dark:bg-[#87102C]/15" />
      <Card label="Total Present"     value={`${data.totalPresent}`}     trend={data.totalPresentChange}     icon={<Users size={13} className="text-emerald-600" />}         accent="bg-emerald-50 dark:bg-emerald-500/10" />
      <Card label="Total Absent"      value={`${data.totalAbsent}`}      trend={data.totalAbsentChange}      icon={<UserX size={13} className="text-red-500" />}             accent="bg-red-50 dark:bg-red-500/10" />
      <Card label="Avg per Service"   value={`${data.avgPerService}`}    sub="members per session"           icon={<Zap size={13} className="text-amber-600" />}             accent="bg-amber-50 dark:bg-amber-500/10" />
      <Card label="Services Held"     value={`${data.totalServicesHeld}`} sub="this period"                 icon={<CalendarCheck size={13} className="text-blue-600" />}    accent="bg-blue-50 dark:bg-blue-500/10" />
      <Card
        label="Most Improved"
        value={data.mostImproved ? `+${data.mostImproved.rateJump}%` : "—"}
        sub={data.mostImproved?.name ?? ""}
        icon={<Star size={13} className="text-violet-600" />}
        accent="bg-violet-50 dark:bg-violet-500/10"
      />
    </div>
  );
}
