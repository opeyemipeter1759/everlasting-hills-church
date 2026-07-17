import { Compass, Plus } from "lucide-react";
import type { HomeCellFilter } from "./useHomeCells";

const TABS: { key: HomeCellFilter; label: string }[] = [
  { key: "ALL",     label: "All" },
  { key: "ACTIVE",  label: "Active" },
  { key: "PENDING", label: "Pending" },
];

export default function HomeCellHeader({
  filter, onFilterChange, counts, onNew,
}: {
  filter: HomeCellFilter;
  onFilterChange: (f: HomeCellFilter) => void;
  counts: Record<HomeCellFilter, number>;
  onNew: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#87102C]/10 dark:bg-[#87102C]/20">
          <Compass size={19} className="text-[#87102C] dark:text-[#e8768a]" />
        </span>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Home Cells</h1>
          <p className="text-xs text-gray-400 dark:text-white/40">Manage cells across Ibadan</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onFilterChange(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === tab.key
                  ? "bg-white dark:bg-white/10 text-[#87102C] dark:text-[#e8768a] shadow-sm"
                  : "text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70"
              }`}
            >
              {tab.label}
              <span className="text-[10px] text-gray-400 dark:text-white/30">{counts[tab.key]}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#6E0C24] shrink-0"
        >
          <Plus size={16} /> Register Cell
        </button>
      </div>
    </div>
  );
}
