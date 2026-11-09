"use client";

import { Search, X } from "lucide-react";
import { Select, type SelectOption } from "@/components/ui/select";
import type { RollGender, RollStatus } from "./roll-query";

const box =
  "rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-[#87102C]/25 dark:border-white/10 dark:bg-white/5 dark:text-gray-300";

export interface RollFilterValues {
  scope: string;
  gender: RollGender;
  name: string;
  status: RollStatus;
}

/** Service, gender and name on one row; who came or didn't as tabs with their counts. */
export default function RollFilters({ values, scopeOptions, counts, onChange, onClear }: {
  values: RollFilterValues;
  scopeOptions: SelectOption[];
  counts: { present: number; absent: number } | null;
  onChange: (patch: Partial<RollFilterValues>) => void;
  onClear: () => void;
}) {
  const filtered = Boolean(values.gender || values.name || values.status);
  const tabs: { value: RollStatus; label: string; count?: number }[] = [
    { value: undefined, label: "Everyone", count: counts ? counts.present + counts.absent : undefined },
    { value: "PRESENT", label: "Present", count: counts?.present },
    { value: "ABSENT", label: "Absent", count: counts?.absent },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select aria-label="Service" prefixLabel="Service" value={values.scope} onChange={(scope) => onChange({ scope })} options={scopeOptions} className={box} />
        <Select
          aria-label="Gender"
          prefixLabel="Gender"
          value={values.gender ?? ""}
          onChange={(v) => onChange({ gender: (v || undefined) as RollGender })}
          options={[
            { value: "", label: "Everyone" },
            { value: "male", label: "Men" },
            { value: "female", label: "Women" },
          ]}
          className={box}
        />
        <label className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <span className="sr-only">Search by name</span>
          <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={values.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Search by name"
            className={`${box} w-full pl-8 placeholder:text-gray-400`}
          />
        </label>
        {filtered && (
          <button type="button" onClick={onClear} className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-gray-500 hover:text-[#87102C] dark:text-white/50 dark:hover:text-[#E8768A]">
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      <div role="group" aria-label="Show" className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-white/[0.06]">
        {tabs.map((t) => {
          const on = values.status === t.value;
          return (
            <button
              key={t.label}
              type="button"
              aria-pressed={on}
              onClick={() => onChange({ status: t.value })}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                on ? "bg-white text-[#1A1210] shadow-sm dark:bg-[#2a2a2e] dark:text-white" : "text-gray-500 hover:text-gray-800 dark:text-white/50 dark:hover:text-white/80"
              }`}
            >
              {t.label}
              {t.count !== undefined && <span className={`tabular-nums ${on ? "text-[#87102C] dark:text-[#E8768A]" : ""}`}>{t.count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
