import { Search } from "lucide-react";
import type { ReadingMonitorPage } from "./useReadingMonitorPage";
import type { Filter } from "./shared";

/** The group chips (with counts) and the member search. */
export default function ReaderFilters({ m }: { m: ReadingMonitorPage }) {
  const stats = m.data?.stats;
  const filters: { value: Filter; label: string; count?: number }[] = [
    { value: "ALL", label: "Everyone", count: stats?.activeMembers },
    { value: "QUIET", label: "Gone quiet", count: stats?.quiet },
    { value: "NEW", label: "Just started", count: stats?.justStarted },
    { value: "READING", label: "Reading", count: stats?.reading },
    { value: "NOT_STARTED", label: "No plan", count: stats?.notStarted },
    { value: "HAS_FINISHED", label: "Finished a plan", count: stats ? m.finishedSomething : undefined },
  ];

  return (
    <div ref={m.listRef} className="flex scroll-mt-24 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show">
        {filters.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={m.filter === option.value}
            onClick={() => m.setFilter(option.value)}
            className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors ${
              m.filter === option.value
                ? "border-transparent bg-[#87102C] text-white"
                : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-white/10 dark:text-white/65"
            }`}
          >
            {option.label}
            {option.count !== undefined && <span className="ml-1 tabular-nums opacity-75">({option.count})</span>}
          </button>
        ))}
      </div>
      <label className="relative block sm:w-64">
        <span className="sr-only">Search members</span>
        <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={m.search}
          onChange={(event) => m.setSearch(event.target.value)}
          placeholder="Search members"
          className="min-h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-800 outline-none focus:border-[#87102C]/50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
        />
      </label>
    </div>
  );
}
