"use client";

import { useState } from "react";
import type { OverviewService } from "@/lib/api/attendance-roll";
import { dayMonth } from "./overview-data";

const PLOT_HEIGHT = 56;

function describe(s: OverviewService): string {
  return s.headcount ? `${dayMonth(s.date)}: ${s.headcount.total} in church` : `${dayMonth(s.date)}: not counted yet`;
}

/** One column per recent service of the same kind; pick a column to open that service. */
export default function RecentServicesStrip({ services, selectedId, onSelect }: { services: OverviewService[]; selectedId: string; onSelect: (id: string) => void }) {
  const [active, setActive] = useState<number | null>(null);
  const top = Math.max(1, ...services.map((s) => s.headcount?.total ?? 0));
  const columns = { gridTemplateColumns: `repeat(${services.length}, minmax(0, 1fr))` };

  return (
    <div>
      <div className="grid items-end gap-1" style={{ ...columns, height: PLOT_HEIGHT }}>
        {services.map((s, i) => {
          const selected = s.id === selectedId;
          const height = s.headcount ? Math.max(4, Math.round((s.headcount.total / top) * PLOT_HEIGHT)) : 0;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              aria-pressed={selected}
              aria-label={describe(s)}
              className="group relative flex h-full flex-col items-center justify-end rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C]"
            >
              {active === i && (
                <span
                  role="tooltip"
                  className={`pointer-events-none absolute bottom-full z-10 mb-1 w-max rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-[#1A1210] shadow-md dark:border-white/10 dark:bg-[#2a2a2e] dark:text-white ${
                    i > services.length * 0.6 ? "right-0" : i < services.length * 0.4 ? "left-0" : ""
                  }`}
                >
                  {describe(s)}
                </span>
              )}
              {s.headcount ? (
                <span
                  className={`w-full max-w-[24px] rounded-t transition-colors ${
                    selected ? "bg-[#87102C] dark:bg-[#E8768A]" : "bg-gray-300 group-hover:bg-gray-400 dark:bg-white/20 dark:group-hover:bg-white/30"
                  }`}
                  style={{ height }}
                />
              ) : (
                <span className={`h-1.5 w-full max-w-[24px] rounded-sm border border-dashed ${selected ? "border-[#87102C] dark:border-[#E8768A]" : "border-gray-300 dark:border-white/25"}`} />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-1 grid gap-1 text-[11px] tabular-nums text-gray-500 dark:text-white/50" style={columns} aria-hidden="true">
        {services.map((s) => (
          <span
            key={s.id}
            className={`whitespace-nowrap text-center ${s.id === selectedId ? "font-semibold text-[#87102C] dark:text-[#E8768A]" : "invisible sm:visible"}`}
          >
            {dayMonth(s.date)}
          </span>
        ))}
      </div>
    </div>
  );
}
