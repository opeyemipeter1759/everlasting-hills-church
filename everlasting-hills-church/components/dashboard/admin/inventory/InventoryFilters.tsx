import { Search } from "lucide-react";
import type { InventoryFiltersData } from "./types";
import { CONDITION_LABEL, STATUS_LABEL } from "./types";
import type { InventoryQuery } from "./useInventory";
import { Select } from "@/components/ui/select";

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

      <Select
        aria-label="Category"
        value={query.category ?? ""}
        onChange={(v) => onChange({ category: v })}
        className={selectCls}
        options={[
          { value: "", label: "All categories" },
          ...(filters?.categories ?? []).map((c) => ({ value: c, label: c })),
        ]}
      />

      <Select
        aria-label="Status"
        value={query.status ?? ""}
        onChange={(v) => onChange({ status: v as InventoryQuery["status"] })}
        className={selectCls}
        options={[
          { value: "", label: "All statuses" },
          ...Object.entries(STATUS_LABEL).map(([k, label]) => ({ value: k, label })),
        ]}
      />

      <Select
        aria-label="Condition"
        value={query.condition ?? ""}
        onChange={(v) => onChange({ condition: v as InventoryQuery["condition"] })}
        className={selectCls}
        options={[
          { value: "", label: "All conditions" },
          ...Object.entries(CONDITION_LABEL).map(([k, label]) => ({ value: k, label })),
        ]}
      />

      <Select
        aria-label="Location"
        value={query.location ?? ""}
        onChange={(v) => onChange({ location: v })}
        className={selectCls}
        options={[
          { value: "", label: "All locations" },
          ...(filters?.locations ?? []).map((l) => ({ value: l, label: l })),
        ]}
      />
    </div>
  );
}
