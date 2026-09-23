"use client";

import { HeartHandshake, ShieldOff, UserCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FollowUpSummary } from "./useFollowUpSummary";

type Tone = "violet" | "burgundy" | "emerald" | "slate";

const TONE: Record<Tone, { tile: string; accent: string }> = {
  violet: { tile: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300", accent: "bg-violet-500" },
  burgundy: { tile: "bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]", accent: "bg-[#87102C]" },
  emerald: { tile: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300", accent: "bg-emerald-500" },
  slate: { tile: "bg-gray-100 text-gray-500 dark:bg-white/[0.07] dark:text-white/50", accent: "bg-gray-400" },
};

function StatCard({
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
  tone: Tone;
  loading: boolean;
}) {
  const { tile, accent } = TONE[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]">
      {/* A colour seam down the left edge ties the card to its meaning. */}
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${accent} opacity-80`} />

      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tile}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
        {loading ? (
          // A number-shaped placeholder: a zero here would read as a real count.
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

/** The four figures the team watches, stated plainly. */
export function StatCards({ summary }: { summary: FollowUpSummary }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        loading={summary.isLoading}
        icon={Users}
        tone="violet"
        value={summary.total}
        label="Church members"
        note="Everyone on the roll, signed in or not"
      />
      <StatCard
        loading={summary.isLoading}
        icon={UserCheck}
        tone="burgundy"
        value={summary.assignedToMe}
        label="Assigned to you"
        note="Yours to reach — everyone sees their own"
      />
      <StatCard
        loading={summary.isLoading}
        icon={HeartHandshake}
        tone="emerald"
        value={summary.integrated}
        label="Integrated"
        note="Settled in — now the Integration Team's to watch"
      />
      <StatCard
        loading={summary.isLoading}
        icon={ShieldOff}
        tone="slate"
        value={summary.optedOut}
        label="Opted out"
        note="Asked not to be contacted for now"
      />
    </div>
  );
}
