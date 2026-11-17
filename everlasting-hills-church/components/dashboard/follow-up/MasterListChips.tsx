"use client";

import { PIPELINE_STATUSES, type PipelineStatus, type StatusCounts } from "@/lib/api/pipeline";
import { STATUS_META } from "./v2/status";

/**
 * Status chips with their counts, "All" first: tap one to see only those
 * people. The counts are the API's, worked out under every other filter, so
 * the chips always add up to All and All is the length of the list.
 */
export function MasterListChips({
  counts,
  value,
  onChange,
}: {
  /** From the pipeline page; undefined while loading. */
  counts?: StatusCounts & { all: number };
  value: PipelineStatus | "";
  onChange: (status: PipelineStatus | "") => void;
}) {
  const chip = (key: PipelineStatus | "", label: string, n: number | undefined, dot?: string) => {
    const on = value === key;
    return (
      <button
        key={key || "all"}
        type="button"
        aria-pressed={on}
        onClick={() => onChange(key)}
        className={`inline-flex h-9 flex-shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition-colors ${
          on
            ? "border-[#87102C] bg-[#87102C] text-white"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80"
        }`}
      >
        {dot && <span aria-hidden="true" className={`h-2 w-2 rounded-full ${on ? "bg-white/80" : dot}`} />}
        {label}
        {n === undefined ? (
          <span className="block h-4 w-5 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        ) : (
          <span className={`tabular-nums ${on ? "text-white/85" : "text-gray-500 dark:text-white/50"}`}>{n}</span>
        )}
      </button>
    );
  };

  return (
    <div role="group" aria-label="Filter by status" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar sm:flex-wrap">
      {chip("", "All", counts?.all)}
      {PIPELINE_STATUSES.map((s) => chip(s, STATUS_META[s].label, counts?.[s], STATUS_META[s].dot))}
    </div>
  );
}
