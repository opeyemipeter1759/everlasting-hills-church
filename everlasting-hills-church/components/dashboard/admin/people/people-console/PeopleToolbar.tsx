import { Download, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { btnSecondary } from "./constants";

export default function PeopleToolbar({
  searchInput,
  onSearchChange,
  onFilter,
  onExport,
  onRefresh,
  refreshing,
}: {
  searchInput: string;
  onSearchChange: (v: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[220px] max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name, email, or phone…"
          className="w-full text-sm rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
        />
      </div>
      <button type="button" onClick={onFilter} className={btnSecondary}>
        <SlidersHorizontal size={15} /> Filter
      </button>
      <button type="button" onClick={onExport} className={btnSecondary}>
        <Download size={15} /> Export CSV
      </button>
      <button type="button" onClick={onRefresh} className={btnSecondary} aria-label="Refresh">
        <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
      </button>
    </div>
  );
}
