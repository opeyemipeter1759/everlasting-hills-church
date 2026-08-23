"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { usePeople } from "@/lib/api/people";
import { Avatar } from "../departments/HeadPicker";
import type { TargetPerson } from "./types";

/** Search-and-add multi-select of individual people, shown as removable chips.
 * Mirrors HeadPicker's search pattern (usePeople) but supports multiple picks
 * inline rather than a single choice in a separate modal. */
export function SpecificPeoplePicker({
  selected,
  onChange,
}: {
  selected: TargetPerson[];
  onChange: (people: TargetPerson[]) => void;
}) {
  const [search, setSearch] = useState("");
  const q = usePeople({ search, limit: 8, sortBy: "name", sortOrder: "asc" });
  const selectedIds = new Set(selected.map((p) => p.id));
  const results = (q.data?.data ?? []).filter((p) => p.profileId && !selectedIds.has(p.profileId));

  function add(id: string, name: string) {
    onChange([...selected, { id, name }]);
    setSearch("");
  }

  function remove(id: string) {
    onChange(selected.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E7CDD3] dark:border-white/10 bg-[#FFF4F6] dark:bg-white/5 pl-1 pr-2 py-1 text-xs font-semibold text-[#87102C] dark:text-[#e8768a]"
            >
              <Avatar name={p.name} photoUrl={null} px={18} />
              {p.name}
              <button type="button" onClick={() => remove(p.id)} className="text-[#87102C]/60 hover:text-[#87102C] dark:text-[#e8768a]/60 dark:hover:text-[#e8768a]">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name to add specific people…"
          className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#87102C]/40 focus:ring-2 focus:ring-[#87102C]/10"
        />

        {search.trim() && (
          <div className="absolute z-10 mt-1.5 w-full max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] shadow-lg">
            {q.isLoading ? (
              <p className="px-3.5 py-3 text-xs text-gray-400">Searching…</p>
            ) : results.length === 0 ? (
              <p className="px-3.5 py-3 text-xs text-gray-400">No matches.</p>
            ) : (
              results.map((p) => (
                <button
                  key={p.profileId}
                  type="button"
                  onClick={() => add(p.profileId as string, p.name)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <Avatar name={p.name} photoUrl={p.photoUrl} px={24} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                    <p className="truncate text-[11px] text-gray-400">{p.email ?? "No email"}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
