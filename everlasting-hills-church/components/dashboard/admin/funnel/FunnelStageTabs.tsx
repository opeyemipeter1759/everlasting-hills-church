"use client";

import Link from "next/link";
import { FUNNEL_BASE, FUNNEL_STAGES } from "@/lib/funnel-stages";
import { useFollowUpCounts } from "@/lib/api/follow-up-counts";
import type { MasterListStatus } from "@/lib/api/follow-up-pipeline";

/** Every stage as a chip, so moving between them is one click and the URL says which. */
export function FunnelStageTabs({ active }: { active: MasterListStatus | null }) {
  const { data: counts, isLoading } = useFollowUpCounts();

  return (
    <div className="flex flex-wrap gap-2">
      <Chip href={FUNNEL_BASE} label="Everyone" count={counts?.total} loading={isLoading} active={!active} />
      {FUNNEL_STAGES.map((stage) => (
        <Chip
          key={stage.status}
          href={`${FUNNEL_BASE}?status=${stage.status}`}
          label={stage.label}
          swatch={stage.swatch}
          count={counts?.byStatus[stage.status]}
          loading={isLoading}
          active={active === stage.status}
        />
      ))}
    </div>
  );
}

function Chip({
  href,
  label,
  swatch,
  count,
  loading,
  active,
}: {
  href: string;
  label: string;
  swatch?: string;
  count?: number;
  loading: boolean;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
        active
          ? "border-[#87102C] bg-[#87102C] text-white"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80"
      }`}
    >
      {swatch && <span aria-hidden="true" className={`h-2 w-2 rounded-full ${active ? "bg-white/70" : swatch}`} />}
      {label}
      {loading ? (
        <span className="block h-4 w-6 animate-pulse rounded bg-black/10 dark:bg-white/10" />
      ) : (
        <span
          className={`rounded-md px-1.5 py-0.5 text-[11px] tabular-nums ${
            active ? "bg-white/20" : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/50"
          }`}
        >
          {count ?? 0}
        </span>
      )}
    </Link>
  );
}
