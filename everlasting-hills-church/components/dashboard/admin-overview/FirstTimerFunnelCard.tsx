"use client";

import Link from "next/link";
import { ArrowRight, Filter } from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import { useFollowUpCounts } from "@/lib/api/follow-up-counts";
import { FUNNEL_BASE, FUNNEL_STAGES } from "@/lib/funnel-stages";

/**
 * Where every newcomer stands, counted the same way the Follow Up and
 * Integration pages count them — first visit through to settled in, with the
 * two ends of the story (away, opted out) stated rather than hidden.
 *
 * Each row opens the list of exactly those people.
 */
export default function FirstTimerFunnelCard({ ...chrome }: DashboardCardChrome) {
  const { data: counts, isLoading } = useFollowUpCounts();
  const values = FUNNEL_STAGES.map((stage) => counts?.byStatus[stage.status] ?? 0);
  const max = Math.max(...values, 1);

  return (
    <DashboardCard kicker="Newcomers" title="First Timer Funnel" icon={Filter} {...chrome}>
      <ul className="space-y-2.5">
        {FUNNEL_STAGES.map((stage, i) => (
          <li key={stage.status}>
            <Link
              href={`${FUNNEL_BASE}?status=${stage.status}`}
              className="group block rounded-xl px-2 py-1.5 -mx-2 transition-colors hover:bg-[#FFF4F6] dark:hover:bg-white/[0.04]"
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <span aria-hidden="true" className={`h-2 w-2 flex-shrink-0 rounded-full ${stage.swatch}`} />
                  <span className="truncate font-medium text-[#444] dark:text-white/70">{stage.label}</span>
                </span>
                <span className="flex flex-shrink-0 items-center gap-2">
                  {isLoading ? (
                    <span className="block h-3.5 w-6 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                  ) : (
                    <span className="font-bold tabular-nums text-[#111] dark:text-white">{values[i]}</span>
                  )}
                  <span className="flex items-center gap-0.5 font-semibold text-[#87102C] opacity-0 transition-opacity group-hover:opacity-100 dark:text-[#FFB3C1]">
                    View
                    <ArrowRight size={12} aria-hidden="true" />
                  </span>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#FFE8ED] dark:bg-white/[0.06]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${stage.bar}`}
                  style={{ width: isLoading ? "0%" : `${Math.round((values[i] / max) * 100)}%` }}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={FUNNEL_BASE}
        className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-[#E7CDD3]/70 px-3 py-2 text-xs font-semibold text-[#87102C] transition-colors hover:bg-[#FFF4F6] dark:border-white/10 dark:text-[#FFB3C1] dark:hover:bg-white/[0.06]"
      >
        View everyone&apos;s details
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </DashboardCard>
  );
}
