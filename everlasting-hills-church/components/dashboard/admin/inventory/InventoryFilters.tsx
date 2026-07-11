import { Search } from "lucide-react";
import type { InventoryFiltersData } from "./types";
import { CONDITION_LABEL, STATUS_LABEL } from "./types";
import type { InventoryQuery } from "./useInventory";

const selectCls =
  "text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all";

export default function InventoryFilters({
  query,
  onChange,
  filters,
}: {
  query: InventoryQuery;
  onChange: (patch: Partial<InventoryQuery>) => void;
  filters?: InventoryFiltersData;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query.search ?? ""}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search name or serial number…"
          className="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
        />
      </div>

      <select
        value={query.category ?? ""}
        onChange={(e) => onChange({ category: e.target.value })}
        className={selectCls}
      >
        <option value="">All categories</option>
        {filters?.categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select value={query.status ?? ""} onChange={(e) => onChange({ status: e.target.value as InventoryQuery["status"] })} className={selectCls}>
        <option value="">All statuses</option>
        {Object.entries(STATUS_LABEL).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </select>

      <select
        value={query.condition ?? ""}
        onChange={(e) => onChange({ condition: e.target.value as InventoryQuery["condition"] })}
        className={selectCls}
      >
        <option value="">All conditions</option>
        {Object.entries(CONDITION_LABEL).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </select>

      <select
        value={query.location ?? ""}
        onChange={(e) => onChange({ location: e.target.value })}
        className={selectCls}
      >
        <option value="">All locations</option>
        {filters?.locations.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
