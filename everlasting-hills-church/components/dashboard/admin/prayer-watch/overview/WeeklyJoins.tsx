"use client";

import { useState } from "react";
import { panel, panelHint, panelTitle, plural, shortDate } from "./format";

const PLOT_HEIGHT = 140;

/** A clean top for the axis: 1, 2, 5, 10, 20, 50… at or above the busiest week. */
function niceCeiling(n: number): number {
  if (n <= 1) return 1;
  const pow = 10 ** Math.floor(Math.log10(n));
  return ([1, 2, 5, 10].find((m) => m * pow >= n) ?? 10) * pow;
}

/** How many people joined the watch each week, over the last twelve weeks. */
export default function WeeklyJoins({ weekly }: { weekly: { weekStart: string; joined: number }[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const top = niceCeiling(Math.max(...weekly.map((w) => w.joined)));
  const busiest = weekly.reduce((best, w, i) => (w.joined > weekly[best].joined ? i : best), 0);
  const total = weekly.reduce((n, w) => n + w.joined, 0);
  const labelled = (i: number) => (i === weekly.length - 1 || i === busiest) && weekly[i].joined > 0;

  return (
    <section className={panel} aria-labelledby="joins-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="joins-title" className={panelTitle}>
            People joining each week
          </h2>
          <p className={panelHint}>{plural(total, "person", "people")} approved in the last twelve weeks</p>
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
        >
          {asTable ? "Show as chart" : "Show as table"}
        </button>
      </div>

      {asTable ? (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 dark:text-white/50">
              <th className="py-1 font-semibold">Week of</th>
              <th className="py-1 text-right font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {weekly.map((w) => (
              <tr key={w.weekStart} className="border-t border-gray-100 dark:border-white/5">
                <td className="py-1.5 text-[#1A1210] dark:text-white/85">{shortDate(w.weekStart)}</td>
                <td className="py-1.5 text-right text-[#1A1210] dark:text-white/85">{w.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="mt-5 flex gap-2">
          <div className="flex flex-col justify-between pb-5 text-right text-[11px] tabular-nums text-gray-400 dark:text-white/40" style={{ height: PLOT_HEIGHT + 20 }} aria-hidden="true">
            <span>{top}</span>
            <span>{top / 2 === Math.round(top / 2) ? top / 2 : ""}</span>
            <span>0</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="relative" style={{ height: PLOT_HEIGHT }}>
              {[0, 0.5, 1].map((f) => (
                <span key={f} className="absolute inset-x-0 border-t border-gray-100 dark:border-white/[0.06]" style={{ bottom: f * PLOT_HEIGHT }} aria-hidden="true" />
              ))}
              <div className="absolute inset-0 grid items-end gap-0.5" style={{ gridTemplateColumns: `repeat(${weekly.length}, minmax(0, 1fr))` }}>
                {weekly.map((w, i) => {
                  const h = w.joined === 0 ? 0 : Math.max(4, Math.round((w.joined / top) * PLOT_HEIGHT));
                  return (
                    <button
                      key={w.weekStart}
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(i)}
                      onBlur={() => setActive(null)}
                      aria-label={`Week of ${shortDate(w.weekStart)}: ${plural(w.joined, "person", "people")} joined`}
                      className="relative flex h-full flex-col items-center justify-end focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C]"
                    >
                      {active === i && (
                        <span role="tooltip" className="pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-[#1A1210] shadow-md dark:border-white/10 dark:bg-[#22171A] dark:text-white">
                          Week of {shortDate(w.weekStart)}: {plural(w.joined, "person", "people")}
                        </span>
                      )}
                      {labelled(i) && <span className="mb-0.5 text-[11px] font-semibold text-[#1A1210] dark:text-white">{w.joined}</span>}
                      <span className={`w-full max-w-[24px] rounded-t ${active === i ? "bg-[#6d0d24] dark:bg-[#F29AAA]" : "bg-[#87102C] dark:bg-[#E8768A]"}`} style={{ height: h }} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-1 grid text-[11px] text-gray-500 dark:text-white/50" style={{ gridTemplateColumns: `repeat(${weekly.length}, minmax(0, 1fr))` }} aria-hidden="true">
              {weekly.map((w, i) => (
                <span key={w.weekStart} className="text-center">
                  {i % 3 === 2 || i === weekly.length - 1 ? shortDate(w.weekStart) : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
