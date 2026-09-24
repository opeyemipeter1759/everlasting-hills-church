"use client";

import { HeartHandshake, UserCheck, UserMinus, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFollowUpCounts } from "@/lib/api/follow-up-counts";

function Card({
  icon: Icon,
  value,
  label,
  note,
  tone,
  loading,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  note: string;
  tone: string;
  loading: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 opacity-80 ${tone}`} />
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/[0.07] dark:text-white/50">
          <Icon size={18} aria-hidden="true" />
        </span>
        {loading ? (
          <span className="mt-1 block h-7 w-10 animate-pulse rounded-md bg-gray-200 dark:bg-white/10" />
        ) : (
          <p className="text-3xl font-bold leading-none tabular-nums text-[#111] dark:text-white">{value}</p>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-[#111] dark:text-white">{label}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-white/45">{note}</p>
    </div>
  );
}

/** What the Integration Team watches: who has settled, and who has slipped away. */
export function IntegrationStats() {
  const { data: counts, isLoading } = useFollowUpCounts();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card
        loading={isLoading}
        icon={HeartHandshake}
        tone="bg-emerald-500"
        value={counts?.byStatus.INTEGRATED ?? 0}
        label="Integrated members"
        note="Settled in — yours to keep settled"
      />
      <Card
        loading={isLoading}
        icon={UserMinus}
        tone="bg-amber-500"
        value={counts?.byStatus.AWAY ?? 0}
        label="Away"
        note="Stopped coming — somebody should visit"
      />
      <Card
        loading={isLoading}
        icon={UserCheck}
        tone="bg-[#87102C]"
        value={counts?.assignedToMe ?? 0}
        label="Assigned to you"
        note="Yours to reach — everyone sees their own"
      />
      <Card
        loading={isLoading}
        icon={Users2}
        tone="bg-violet-500"
        value={counts?.total ?? 0}
        label="Church members"
        note="Everyone on the roll, signed in or not"
      />
    </div>
  );
}
