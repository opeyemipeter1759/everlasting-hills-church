"use client";

import { AlertTriangle, Layers, UserCheck, UserX } from "lucide-react";
import type { ServiceTeamStats } from "@/lib/api/service-teams";

/**
 * The five numbers that decide what to do next.
 *
 * "Serving" leads because the honest headline is a ratio, not a count: eleven
 * people serving reads fine until you see it against seventy-four members. The
 * two problem tiles — nobody serving, teams with no lead — are styled as
 * problems when they are non-zero and stay quiet when they are not, so the
 * strip does not cry wolf in a church that has its teams staffed.
 */
export default function StatsStrip({
  stats,
  loading,
}: {
  stats?: ServiceTeamStats;
  loading?: boolean;
}) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
        ))}
      </div>
    );
  }

  const rate = stats.activeMembers
    ? Math.round((stats.serving / stats.activeMembers) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Tile
        icon={UserCheck}
        label="Serving"
        value={`${stats.serving}`}
        detail={`${rate}% of ${stats.activeMembers} active`}
        tone="brand"
      />
      <Tile
        icon={UserX}
        label="Not serving"
        value={`${stats.notServing}`}
        detail="No team yet"
        tone={stats.notServing > stats.serving ? "warn" : "plain"}
      />
      <Tile icon={Layers} label="Teams" value={`${stats.teamCount}`} detail="Across all departments" tone="plain" />
      <Tile
        icon={AlertTriangle}
        label="No lead"
        value={`${stats.teamsWithoutLead}`}
        detail={stats.teamsWithoutLead ? "Needs a lead appointed" : "Every team has a lead"}
        tone={stats.teamsWithoutLead ? "warn" : "good"}
      />
      <Tile
        icon={Layers}
        label="On two or more"
        value={`${stats.servingInMoreThanOne}`}
        detail="Serving in several teams"
        tone="plain"
      />
    </div>
  );
}

const TONES = {
  brand: "border-[#E7CDD3]/70 bg-[#FFF4F6]/60 dark:border-white/10 dark:bg-[#87102C]/10",
  warn: "border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/[0.07]",
  good: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/[0.07]",
  plain: "border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]",
} as const;

const ICON_TONES = {
  brand: "text-[#87102C] dark:text-[#FFB3C1]",
  warn: "text-amber-600 dark:text-amber-400",
  good: "text-emerald-600 dark:text-emerald-400",
  plain: "text-gray-400 dark:text-white/35",
} as const;

function Tile({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof UserCheck;
  label: string;
  value: string;
  detail: string;
  tone: keyof typeof TONES;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${TONES[tone]}`}>
      <div className="flex items-center gap-1.5">
        <Icon size={13} className={ICON_TONES[tone]} />
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-white/40">
          {label}
        </p>
      </div>
      <p className="mt-1.5 text-2xl font-black tabular-nums text-[#111] dark:text-white">{value}</p>
      <p className="mt-0.5 text-[11px] text-[#8a7e80] dark:text-white/40">{detail}</p>
    </div>
  );
}
