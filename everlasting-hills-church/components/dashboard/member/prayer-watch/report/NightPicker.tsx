"use client";

import { Check } from "lucide-react";
import type { LedWatch } from "@/lib/api/prayer-watch-reports";

const weekday = (night: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short" }).format(new Date(`${night}T00:00:00Z`));
const day = (night: string) => new Date(`${night}T00:00:00Z`).getUTCDate();

/** The last week of watch nights, newest first; each shows whether its report is in. */
export default function NightPicker({
  nights,
  value,
  onChange,
  accent,
}: {
  nights: LedWatch["nights"];
  value: string;
  onChange: (night: string) => void;
  accent: { bg: string; text: string };
}) {
  return (
    <div role="radiogroup" aria-label="Which night" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {nights.map(({ night, report }) => {
        const on = night === value;
        return (
          <button
            key={night}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${weekday(night)} ${day(night)}: ${report ? "report sent" : "no report yet"}`}
            onClick={() => onChange(night)}
            style={on ? { background: accent.bg, color: accent.text, borderColor: accent.bg } : undefined}
            className={`flex min-w-[64px] flex-shrink-0 flex-col items-center rounded-xl border px-3 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87102C] ${
              on ? "" : "border-gray-200 bg-white text-[#111] hover:border-gray-300 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:hover:border-white/25"
            }`}
          >
            <span className="text-xs font-medium opacity-75">{weekday(night)}</span>
            <span className="text-lg font-semibold tabular-nums leading-tight">{day(night)}</span>
            {report ? (
              <span className="mt-0.5 flex items-center gap-0.5 text-[11px] font-semibold">
                <Check size={12} aria-hidden="true" /> Sent
              </span>
            ) : (
              <span className="mt-0.5 text-[11px] opacity-70">To do</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
