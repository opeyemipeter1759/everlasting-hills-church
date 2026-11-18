"use client";

import { Select } from "@/components/ui/select";
import type { AuditFilterOptions } from "@/lib/api/audit-trail";
import { areaLabel } from "@/lib/audit/format";

export interface FilterState {
  search: string;
  actor: string;
  area: string;
  from: string;
  to: string;
}

export const NO_FILTERS: FilterState = { search: "", actor: "", area: "", from: "", to: "" };

const box =
  "h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-base text-[#111] dark:border-white/15 dark:bg-white/5 dark:text-white sm:text-sm";

/** Search, person, section and dates, in one row above the trail. */
export function ActivityFilters({
  value,
  onChange,
  options,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  options: AuditFilterOptions | undefined;
}) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });
  const people = [{ value: "", label: "Everyone" }, ...(options?.people ?? []).map((p) => ({ value: p.userId, label: p.name }))];
  const areas = [{ value: "", label: "Every section" }, ...(options?.areas ?? []).map((a) => ({ value: a, label: areaLabel(a) }))]
    .sort((a, b) => (a.value === "" ? -1 : b.value === "" ? 1 : a.label.localeCompare(b.label)));
  const filtered = Object.values(value).some(Boolean);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))_auto_auto_auto] lg:items-end">
      <input
        value={value.search}
        onChange={(e) => set({ search: e.target.value })}
        placeholder="Search names, people, details"
        aria-label="Search the audit trail"
        className={box}
      />
      <Select value={value.actor} onChange={(actor) => set({ actor })} options={people} prefixLabel="Who" aria-label="Who did it" className={box} />
      <Select value={value.area} onChange={(area) => set({ area })} options={areas} prefixLabel="Section" aria-label="Section" className={box} />
      <label className="block text-xs font-semibold text-gray-500 dark:text-white/45">
        From
        <input type="date" value={value.from} max={value.to || undefined} onChange={(e) => set({ from: e.target.value })} className={`${box} mt-1 dark:[color-scheme:dark]`} />
      </label>
      <label className="block text-xs font-semibold text-gray-500 dark:text-white/45">
        To
        <input type="date" value={value.to} min={value.from || undefined} onChange={(e) => set({ to: e.target.value })} className={`${box} mt-1 dark:[color-scheme:dark]`} />
      </label>
      {filtered && (
        <button
          type="button"
          onClick={() => onChange(NO_FILTERS)}
          className="h-11 rounded-xl px-3 text-sm font-semibold text-[#87102C] hover:bg-[#87102C]/5 dark:text-[#f3a9b8] dark:hover:bg-white/5"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
