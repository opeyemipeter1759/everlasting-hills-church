"use client";

import { Users, UserPlus, Wifi, WifiOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFirstTimerStats } from "@/lib/api/visitors";
import type { VisitorRow } from "./types";

function StatCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  loading,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col   gap-3 rounded-2xl border border-[#E7CDD3]/60 dark:border-white/[0.09] bg-white dark:bg-white/[0.05] px-4 py-3.5 shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none">
      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon size={17} className={iconColor} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        {loading ? (
          <div className="h-6 w-10 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
        ) : (
          <p className="text-xl font-black tabular-nums text-[#111] dark:text-white leading-none">{value}</p>
        )}
        <p className="mt-1 text-[11px] font-semibold text-[#8a7e80] dark:text-white/40 truncate">{label}</p>
      </div>
    </div>
  );
}

/**
 * Four counts: the true all-time total (from the backend — this page's own
 * `visitors` prop only ever holds unconverted rows), how many of those are
 * still in the pipeline right now, and an online-first-timer breakdown using
 * the same "awaiting 2nd visit" check-in flag already shown per-row.
 */
export default function FirstTimerStatsCards({ active }: { active: VisitorRow[] }) {
  const { data: stats, isLoading } = useFirstTimerStats();

  const current = active.length;
  const online = active.filter((v) => v.attendanceType === "Online");
  const onlineConfirmed = online.filter((v) => v.hasOnlineCheckIn).length;
  const onlineNew = online.length - onlineConfirmed;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={Users}
        label="First-Timers Ever"
        value={stats?.total ?? 0}
        loading={isLoading}
        iconBg="bg-[#FFE8ED] dark:bg-[#87102C]/25"
        iconColor="text-[#87102C] dark:text-[#FFB3C1]"
      />
      <StatCard
        icon={UserPlus}
        label="Current (Unconverted)"
        value={current}
        iconBg="bg-amber-50 dark:bg-amber-500/15"
        iconColor="text-amber-600 dark:text-amber-400"
      />
      <StatCard
        icon={Wifi}
        label="Online — Confirmed"
        value={onlineConfirmed}
        iconBg="bg-emerald-50 dark:bg-emerald-500/15"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        icon={WifiOff}
        label="Online — New"
        value={onlineNew}
        iconBg="bg-sky-50 dark:bg-sky-500/15"
        iconColor="text-sky-600 dark:text-sky-400"
      />
    </div>
  );
}
