"use client";
import { Users, TrendingUp, TrendingDown, CalendarCheck } from "lucide-react";
import { useAdminStatsOverview } from "@/lib/api";

function Card({ label, value, sub, icon, bg, fg, loading }: {
  label: string; value: number; sub: string;
  icon: React.ReactNode; bg: string; fg: string; loading?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col gap-1 transition-colors">
      <div className="flex items-start justify-between mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bg}`}>
          <span className={fg}>{icon}</span>
        </div>
      </div>
      {loading ? (
        <>
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700/60 rounded animate-pulse" />
          <div className="h-2.5 w-24 bg-gray-100 dark:bg-gray-700/40 rounded animate-pulse mt-0.5" />
        </>
      ) : (
        <>
          <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{sub}</p>
        </>
      )}
    </div>
  );
}

export function AttendanceStatCards() {
  const { data, isLoading } = useAdminStatsOverview();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card label="Total Members" value={data?.totalMembers ?? 0} sub="registered members" icon={<Users size={14} />} bg="bg-blue-50 dark:bg-blue-500/10" fg="text-blue-600 dark:text-blue-400" loading={isLoading} />
      <Card label="Active This Month" value={data?.activeThisMonth ?? 0} sub="attended at least once" icon={<TrendingUp size={14} />} bg="bg-emerald-50 dark:bg-emerald-500/10" fg="text-emerald-600 dark:text-emerald-400" loading={isLoading} />
      <Card label="Inactive This Month" value={data?.inactiveThisMonth ?? 0} sub="zero attendance" icon={<TrendingDown size={14} />} bg="bg-amber-50 dark:bg-amber-500/10" fg="text-amber-600 dark:text-amber-400" loading={isLoading} />
      <Card label="Today's Check-ins" value={data?.todayPresent ?? 0} sub="individual app check-ins" icon={<CalendarCheck size={14} />} bg="bg-[#87102C]/10 dark:bg-[#87102C]/15" fg="text-[#87102C] dark:text-[#e8768a]" loading={isLoading} />
    </div>
  );
}
