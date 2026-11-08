import { Download, RefreshCw, SlidersHorizontal } from "lucide-react";

/** Filter toggle and record count on the left; Export CSV and Refresh on the right. */
export function AttendanceToolbar({ showFilter, onToggleFilter, count, onExport, onRefresh, refreshing }: {
  showFilter: boolean;
  onToggleFilter: () => void;
  count: number;
  onExport: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] px-5 py-3.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleFilter}
          aria-pressed={showFilter}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
            showFilter
              ? "bg-[#87102C] text-white"
              : "bg-[#FFF4F6] dark:bg-white/5 text-[#87102C] dark:text-[#FFB3C1] hover:bg-[#FFE8ED] dark:hover:bg-white/10"
          }`}
        >
          <SlidersHorizontal size={13} />
          Filter
        </button>
        <p className="text-sm font-semibold text-[#87102C] dark:text-[#FFB3C1]">
          {count} record{count === 1 ? "" : "s"} found
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#6E0C24] hover:shadow-lg hover:shadow-[#87102C]/25"
        >
          <Download size={15} />
          Export CSV
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-xl border border-[#E7CDD3] dark:border-white/10 px-5 py-2.5 text-sm font-semibold text-[#87102C] dark:text-white/70 transition-colors hover:bg-[#FFF4F6] dark:hover:bg-white/5"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
    </div>
  );
}
