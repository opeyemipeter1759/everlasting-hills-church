"use client";

import { PIPELINE_STATUSES, type PipelineStatus, type StatusCounts } from "@/lib/api/pipeline";
import { STATUS_META } from "../status";

/** Status chips with their counts, "All" first. Tapping one filters the list below. */
export function StatusFilterChips({
  counts,
  value,
  onChange,
}: {
  counts: (StatusCounts & { all: number }) | undefined;
  value: PipelineStatus | "";
  onChange: (status: PipelineStatus | "") => void;
}) {
  const chips: { key: PipelineStatus | ""; label: string; n?: number; dot?: string }[] = [
    { key: "", label: "All", n: counts?.all },
    ...PIPELINE_STATUSES.map((s) => ({ key: s, label: STATUS_META[s].label, n: counts?.[s], dot: STATUS_META[s].dot })),
  ];

  return (
    <div role="group" aria-label="Filter by status" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {chips.map((c) => {
        const active = value === c.key;
        return (
          <button
            key={c.key || "all"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(c.key)}
            className={`inline-flex min-h-[40px] flex-shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors ${
              active
                ? "border-[#87102C] bg-[#87102C] text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/75"
            }`}
          >
            {c.dot && <span aria-hidden="true" className={`h-2 w-2 rounded-full ${c.dot}`} />}
            {c.label}
            <span className={`tabular-nums ${active ? "text-white/85" : "text-gray-500 dark:text-white/45"}`}>{c.n ?? "-"}</span>
          </button>
        );
      })}
    </div>
  );
}
