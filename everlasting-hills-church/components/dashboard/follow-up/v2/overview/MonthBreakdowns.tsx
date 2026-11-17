"use client";

import { useMonthBreakdowns } from "@/lib/api/first-timer-visits";
import { CARD_SURFACE } from "./MonthCard";

function Breakdown({ title, rows, loading }: { title: string; rows: { key: string; label: string; n: number }[]; loading: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <section className={`${CARD_SURFACE} p-4`} aria-label={title}>
      <h2 className="text-sm font-semibold text-[#111] dark:text-white">{title}</h2>
      {loading ? (
        <div className="mt-3 h-20 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.05]" />
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500 dark:text-white/45">Nobody this month.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((r) => (
            <li key={r.key} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-gray-700 dark:text-white/75">{r.label}</span>
                <span className="font-semibold tabular-nums text-[#111] dark:text-white">{r.n}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#FFE8ED] dark:bg-white/[0.06]" aria-hidden="true">
                <div className="h-full rounded-full bg-[#87102C]/70 dark:bg-[#FFB3C1]/60" style={{ width: `${Math.round((r.n / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** How the month's first-timers heard about the church, and who they are assigned to. */
export function MonthBreakdowns({ year, month }: { year: number; month: number }) {
  const { data, isLoading } = useMonthBreakdowns(year, month);
  const heard = (data?.heardFrom ?? []).map((h) => ({ key: h.label, label: h.label, n: h.n }));
  const assignees = (data?.assignees ?? []).map((a) => ({ key: a.id ?? "none", label: a.name ?? "Nobody assigned", n: a.n }));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Breakdown title="How they heard about us" rows={heard} loading={isLoading} />
      <Breakdown title="Who they are assigned to" rows={assignees} loading={isLoading} />
    </div>
  );
}
