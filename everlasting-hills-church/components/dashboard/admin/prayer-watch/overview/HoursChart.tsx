"use client";

import { useState } from "react";
import type { ReportsSummary } from "@/lib/api/prayer-watch-overview";
import { durationShort, nightShort } from "@/lib/prayer-watch-nights";
import { plural, shortDate } from "./format";

const PLOT_HEIGHT = 150;
type Night = ReportsSummary["daily"][number];

export function nightSummary(n: Night, watches: number): string {
  if (!n.tracked) return `${nightShort(n.night)}: before reports began`;
  const missing = n.missing ? `, ${plural(n.missing, "watch", "watches")} didn't report` : "";
  return `${nightShort(n.night)}: ${durationShort(n.minutes)} prayed, ${n.reported} of ${watches} watches reported${missing}, ${plural(n.people, "person", "people")}`;
}

/** One column per watch night, measured against a full night of prayer. */
export default function HoursChart({ daily, fullNightMinutes, watches }: { daily: Night[]; fullNightMinutes: number; watches: number }) {
  const [active, setActive] = useState<number | null>(null);
  const top = Math.max(fullNightMinutes, ...daily.map((d) => d.minutes), 60);
  const latest = daily.reduce((at, d, i) => (d.tracked ? i : at), -1);
  const isMonday = (night: string) => new Date(`${night}T00:00:00Z`).getUTCDay() === 1;

  return (
    <div className="mt-5 flex gap-2">
      <div className="flex flex-col justify-between pb-5 text-right text-[11px] tabular-nums text-gray-400 dark:text-white/40" style={{ height: PLOT_HEIGHT + 20 }} aria-hidden="true">
        <span>{durationShort(top)}</span>
        <span>{durationShort(Math.round(top / 2))}</span>
        <span>0</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height: PLOT_HEIGHT }}>
          {[0, 0.5].map((f) => (
            <span key={f} className="absolute inset-x-0 border-t border-gray-100 dark:border-white/[0.06]" style={{ bottom: f * PLOT_HEIGHT }} aria-hidden="true" />
          ))}
          <span className="absolute inset-x-0 border-t border-dashed border-gray-300 dark:border-white/20" style={{ bottom: (fullNightMinutes / top) * PLOT_HEIGHT }} aria-hidden="true" />
          <span className="absolute right-0 -translate-y-full pb-0.5 text-[11px] text-gray-500 dark:text-white/50" style={{ bottom: (fullNightMinutes / top) * PLOT_HEIGHT }} aria-hidden="true">
            Full night
          </span>
          <div className="absolute inset-0 grid items-end gap-0.5" style={{ gridTemplateColumns: `repeat(${daily.length}, minmax(0, 1fr))` }}>
            {daily.map((d, i) => {
              const h = d.minutes === 0 ? 0 : Math.max(4, Math.round((d.minutes / top) * PLOT_HEIGHT));
              return (
                <button
                  key={d.night}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  aria-label={nightSummary(d, watches)}
                  className="relative flex h-full flex-col items-center justify-end focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C]"
                >
                  {active === i && (
                    <span
                      role="tooltip"
                      className={`pointer-events-none absolute bottom-full z-10 mb-1 w-max max-w-[220px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-left text-xs text-[#1A1210] shadow-md dark:border-white/10 dark:bg-[#22171A] dark:text-white ${
                        i > daily.length * 0.6 ? "right-0" : i < daily.length * 0.4 ? "left-0" : ""
                      }`}
                    >
                      {nightSummary(d, watches)}
                    </span>
                  )}
                  {i === latest && d.minutes > 0 && <span className="mb-0.5 whitespace-nowrap text-[11px] font-semibold text-[#1A1210] dark:text-white">{durationShort(d.minutes)}</span>}
                  {d.tracked && d.minutes === 0 ? (
                    <span className="h-0.5 w-full max-w-[24px] rounded-full bg-gray-300 dark:bg-white/25" />
                  ) : (
                    <span className={`w-full max-w-[24px] rounded-t ${active === i ? "bg-[#6d0d24] dark:bg-[#F29AAA]" : "bg-[#87102C] dark:bg-[#E8768A]"}`} style={{ height: h }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-1 grid text-[11px] text-gray-500 dark:text-white/50" style={{ gridTemplateColumns: `repeat(${daily.length}, minmax(0, 1fr))` }} aria-hidden="true">
          {daily.map((d, i) => (
            <span key={d.night} className={`overflow-visible whitespace-nowrap ${i === daily.length - 1 ? "text-right" : "text-center"}`}>
              {isMonday(d.night) ? shortDate(d.night) : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
