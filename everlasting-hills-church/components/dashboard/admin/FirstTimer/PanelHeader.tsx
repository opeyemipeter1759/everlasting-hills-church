import { UserPlus } from "lucide-react";
import type { InterestFilter } from "./useFirstTimersFilter";
import FilterTabs from "./FilterTabs";
import SearchBox from "./SearchBox";

export default function PanelHeader({
  total,
  filterTabs,
  filter,
  onFilterChange,
  search,
  onSearchChange,
}: {
  total: number;
  filterTabs: { key: InterestFilter; label: string; count: number }[];
  filter: InterestFilter;
  onFilterChange: (f: InterestFilter) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <UserPlus size={15} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1]">
            Newcomers
          </p>
          <div className="flex items-center gap-2 -mt-0.5">
            <h2 className="font-bold text-[#111] dark:text-white text-sm">All Submissions</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFF4F6] dark:bg-white/[0.07] text-[#8a7e80] dark:text-white/45">
              {total}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <FilterTabs tabs={filterTabs} active={filter} onChange={onFilterChange} />
        <SearchBox value={search} onChange={onSearchChange} />
      </div>
    </div>
  );
}
