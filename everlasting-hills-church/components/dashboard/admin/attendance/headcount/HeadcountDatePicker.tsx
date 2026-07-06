"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { watTodayStr, lastWeekdayStr } from "./date-utils";

/** Date input plus quick chips (Today / Last Sunday / Last Wednesday). */
export default function HeadcountDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}) {
  const chips = useMemo(
    () => [
      { label: "Today", value: watTodayStr() },
      { label: "Last Sunday", value: lastWeekdayStr(0) },
      { label: "Last Wednesday", value: lastWeekdayStr(3) },
    ],
    [],
  );

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <label htmlFor="hc-date" className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40">
          Service date
        </label>
        <div className="flex items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#87102C]/10 dark:bg-[#87102C]/15 text-[#87102C] dark:text-[#e8768a]">
            <CalendarDays size={18} />
          </span>
          <input
            id="hc-date"
            type="date"
            value={value}
            max={watTodayStr()}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => onChange(c.value)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
              value === c.value
                ? "bg-[#87102C] text-white"
                : "bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:text-[#87102C]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
