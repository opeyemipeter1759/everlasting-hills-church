"use client";

import { useState } from "react";
import { History, RefreshCw } from "lucide-react";
import { useDebounced } from "@/components/dashboard/follow-up/MasterListToolbar";
import { SkeletonBlock } from "@/components/ui/display/SkeletonBlock";
import { useAuditFilterOptions, useAuditTrail } from "@/lib/api/audit-trail";
import { ActivityFilters, type FilterState, NO_FILTERS } from "./ActivityFilters";
import { ActivityRow } from "./ActivityRow";

/**
 * The general audit trail: everything people did on the dashboard (people added,
 * roles and permissions given, first-timers deleted, CMS edits, approvals…),
 * newest first, with who, when, who or what it was about, and the details.
 */
export function ActivityTrail() {
  const [filters, setFilters] = useState<FilterState>(NO_FILTERS);
  const search = useDebounced(filters.search).trim();
  const q = useAuditTrail({ ...filters, search });
  const options = useAuditFilterOptions();
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 xs:p-6 dark:border-white/10 dark:bg-[#161618]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#87102C] via-[#c23a5b] to-[#87102C]/30" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#87102C]/10 dark:bg-[#87102C]/15">
              <History size={19} className="text-[#87102C] dark:text-[#e8768a]" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Audit trail</h1>
              <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-white/50">
                Everything people did on the dashboard: who did it, when, who it was about and what they entered. Open a line for the details.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => q.refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <RefreshCw size={12} className={q.isFetching ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <ActivityFilters value={filters} onChange={setFilters} options={options.data} />

      {q.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : q.isError ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          The audit trail could not be loaded. Check your connection and press Refresh.
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-white/15 dark:text-white/50">
          Nothing matches these filters. Clear them to see everything.
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </ul>
          {q.hasNextPage && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => q.fetchNextPage()}
                disabled={q.isFetchingNextPage}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/5"
              >
                {q.isFetchingNextPage ? "Loading…" : "Show older"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
