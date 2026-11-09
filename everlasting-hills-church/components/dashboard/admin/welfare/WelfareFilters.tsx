import { Search, X } from "lucide-react";
import { STATUS_TABS } from "./shared";
import type { WelfareFilterState } from "./useWelfareFilters";

/** Search box and the status tabs, each tab showing how many requests it holds. */
export default function WelfareFilters({ f }: { f: WelfareFilterState }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={f.search}
            onChange={(e) => f.setSearch(e.target.value)}
            placeholder="Search by name, phone, or email…"
            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
          />
        </div>
        {f.hasFilters && (
          <button
            type="button"
            onClick={f.clearFilters}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => f.setStatus(t.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              f.status === t.value
                ? "bg-[#87102C] text-white"
                : "border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:border-[#87102C]/30"
            }`}
          >
            {t.label}
            {t.value && f.counts[t.value] > 0 && (
              <span className={`ml-1.5 ${f.status === t.value ? "text-white/70" : "text-gray-400 dark:text-white/30"}`}>
                {f.counts[t.value]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
