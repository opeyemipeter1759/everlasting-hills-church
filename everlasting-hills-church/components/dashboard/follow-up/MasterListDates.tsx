"use client";

import { CalendarRange } from "lucide-react";
import { Select } from "@/components/ui/select";
import type { MasterListQuery } from "@/lib/api/follow-up-pipeline";
import { DATE_OPTIONS, PILL, rangeFor, type DatePreset } from "./filter-bits";

// PILL already sets px-3; swapping it keeps the native date text from wrapping.
const DATE_FIELD = `${PILL.replace("px-3", "px-2.5")} min-w-0 flex-1 sm:w-[9.5rem] sm:flex-none [color-scheme:light] dark:[color-scheme:dark]`;

/**
 * When someone came. Most of the time a preset is what is wanted, so exact
 * dates only appear once they are asked for.
 */
export function MasterListDates({
  value,
  preset,
  onPreset,
  onChange,
}: {
  value: MasterListQuery;
  preset: DatePreset;
  onPreset: (preset: DatePreset) => void;
  onChange: (patch: Partial<MasterListQuery>) => void;
}) {
  return (
    <>
      <Select
        aria-label="Filter by when they came"
        value={preset}
        onChange={(next) => {
          onPreset(next as DatePreset);
          onChange(rangeFor(next as DatePreset));
        }}
        className={`${PILL} w-full sm:w-[11.5rem]`}
        icon={<CalendarRange size={15} aria-hidden="true" />}
        prefixLabel="When:"
        options={DATE_OPTIONS}
      />

      {preset === "custom" && (
        <div className="flex w-full items-center gap-1.5 sm:w-auto">
          <input
            type="date"
            aria-label="From"
            value={value.from ?? ""}
            onChange={(e) => onChange({ from: e.target.value })}
            className={DATE_FIELD}
          />
          <span className="text-sm text-gray-400 dark:text-white/35">to</span>
          <input
            type="date"
            aria-label="To"
            value={value.to ?? ""}
            onChange={(e) => onChange({ to: e.target.value })}
            className={DATE_FIELD}
          />
        </div>
      )}
    </>
  );
}
