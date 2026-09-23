"use client";

import { Search } from "lucide-react";
import { PILL } from "./filter-bits";

/** Find somebody by name, without leaving the list you are on. */
export function FilterSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative min-w-[13rem] flex-1">
      <Search
        size={15}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search a name"
        aria-label="Search people"
        className={`${PILL} w-full pl-9 placeholder:font-normal placeholder:text-gray-400 focus:border-[#87102C]/40 focus:outline-none focus:ring-2 focus:ring-[#87102C]/10`}
      />
    </div>
  );
}
