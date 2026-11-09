"use client";

import { useState } from "react";
import type { OverviewService } from "@/lib/api/attendance-roll";
import { GROUPS, dayMonth } from "../overview/overview-data";

const PLOT_HEIGHT = 180;

export function describePoint(s: OverviewService): string {
  if (!s.headcount) return `${dayMonth(s.date)}: not counted`;
  const h = s.headcount;
  return `${dayMonth(s.date)}: ${h.total} in church, ${h.men} men, ${h.women} women, ${h.children} children`;
}

/** One stacked column per service: men at the base, then women, then children. */
export default function HeadcountColumns({ points }: { points: OverviewService[] }) {
  const [active, setActive] = useState<number | null>(null);
  // Headroom above the tallest column for its label, rounded to a tidy ten.
  const top = Math.max(10, Math.ceil((Math.max(0, ...points.map((p) => p.headcount?.total ?? 0)) * 1.12) / 10) * 10);
  const columns = { gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` };
  // A fixed row, so one tall column cannot stretch the row and push every bar below the baseline.
  const plotGrid = { ...columns, gridTemplateRows: `${PLOT_HEIGHT}px` };
  const latest = points.reduce((at, p, i) => (p.headcount ? i : at), -1);

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between pb-5 text-right text-[11px] tabular-nums text-gray-400 dark:text-white/40" style={{ height: PLOT_HEIGHT + 20 }} aria-hidden="true">
        <span>{top}</span>
        <span>{Math.round(top / 2)}</span>
        <span>0</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height: PLOT_HEIGHT }}>
          {[0, 0.5, 1].map((f) => (
            <span key={f} className="absolute inset-x-0 border-t border-gray-100 dark:border-white/[0.06]" style={{ bottom: f * PLOT_HEIGHT }} aria-hidden="true" />
          ))}
          <div className="absolute inset-0 grid items-end gap-1" style={plotGrid}>
            {points.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={describePoint(p)}
                className="relative flex h-full flex-col items-center justify-end rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C]"
              >
                {active === i && (
                  <span
                    role="tooltip"
                    className={`pointer-events-none absolute bottom-full z-10 mb-1 w-max max-w-[220px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-left text-xs text-[#1A1210] shadow-md dark:border-white/10 dark:bg-[#2a2a2e] dark:text-white ${
                      i > points.length * 0.6 ? "right-0" : i < points.length * 0.4 ? "left-0" : ""
                    }`}
                  >
                    {describePoint(p)}
                  </span>
                )}
                {i === latest && p.headcount && <span className="mb-0.5 text-[11px] font-semibold tabular-nums text-[#1A1210] dark:text-white">{p.headcount.total}</span>}
                {p.headcount ? (
                  <span className="flex w-full max-w-[24px] flex-col-reverse gap-0.5 overflow-hidden rounded-t" style={{ height: Math.max(4, (p.headcount.total / top) * PLOT_HEIGHT) }}>
                    {GROUPS.map((g) => (p.headcount![g.key] > 0 ? <span key={g.key} className={g.swatch} style={{ flexGrow: p.headcount![g.key] }} /> : null))}
                  </span>
                ) : (
                  <span className="h-1.5 w-full max-w-[24px] rounded-sm border border-dashed border-gray-300 dark:border-white/25" />
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-1 grid gap-1 text-[11px] tabular-nums text-gray-500 dark:text-white/50" style={columns} aria-hidden="true">
          {points.map((p, i) => (
            <span key={p.id} className={`whitespace-nowrap text-center ${(points.length - 1 - i) % 2 === 0 ? "" : "invisible sm:visible"}`}>
              {dayMonth(p.date)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
