"use client";

import type { LucideIcon } from "lucide-react";

export interface EvangelismTabDef<Id extends string> {
  id: Id;
  label: string;
  /** A shorter label for the phone's bottom bar, where six tabs share the width. */
  shortLabel?: string;
  icon: LucideIcon;
}

/**
 * The same tabs as Follow Up: on a phone, a bar fixed to the bottom of the
 * screen — icon over label, the open tab filled burgundy, counts on the icon.
 * From `sm` up, underlined tabs pinned under the page title, with counts
 * beside the labels. The page must leave room for the phone bar
 * (EVANGELISM_TABS_BOTTOM_SPACE).
 */
export function EvangelismTabs<Id extends string>({
  tabs,
  active,
  counts = {},
  onChange,
}: {
  tabs: EvangelismTabDef<Id>[];
  active: Id;
  counts?: Partial<Record<Id, number>>;
  onChange: (tab: Id) => void;
}) {
  return (
    <>
      {/* Phone: bottom bar, as on Follow Up. */}
      <div
        role="tablist"
        aria-label="Evangelism views"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-gray-200 bg-white px-1.5 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-gray-950 sm:hidden"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          const count = counts[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={tab.label}
              onClick={() => onChange(tab.id)}
              className={`my-1.5 flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 text-center text-[11px] font-bold leading-tight transition-colors ${
                selected ? "bg-[#87102C] text-white shadow-sm" : "text-gray-500 dark:text-white/45"
              }`}
            >
              <span className="relative">
                <tab.icon size={16} aria-hidden="true" />
                {typeof count === "number" && count > 0 && (
                  <span
                    className={`absolute -right-3.5 -top-2 min-w-[1.1rem] rounded-full px-1 text-[10px] font-bold leading-4 tabular-nums ${
                      selected ? "bg-white text-[#87102C]" : "bg-[#87102C] text-white dark:bg-[#FFB3C1] dark:text-[#5E0A1E]"
                    }`}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </span>
              <span className="w-full truncate">{tab.shortLabel ?? tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tablet and up: underlined tabs pinned under the title. */}
      <div className="sticky top-0 z-20 hidden bg-gray-50/95 backdrop-blur dark:bg-gray-950/95 sm:block">
        <div role="tablist" aria-label="Evangelism views" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-white/10">
          {tabs.map((tab) => {
            const selected = tab.id === active;
            const count = counts[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onChange(tab.id)}
                className={`relative flex h-12 shrink-0 items-center gap-2 px-4 text-sm font-medium transition-colors ${
                  selected
                    ? "text-[#87102C] dark:text-[#FFB3C1]"
                    : "text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white"
                }`}
              >
                <tab.icon size={16} aria-hidden="true" className={selected ? "" : "text-gray-400"} />
                {tab.label}
                {typeof count === "number" && count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                      selected ? "bg-[#87102C] text-white dark:bg-[#FFB3C1] dark:text-[#5E0A1E]" : "bg-gray-200/70 text-gray-600 dark:bg-white/10 dark:text-white/60"
                    }`}
                  >
                    {count}
                  </span>
                )}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#87102C] transition-opacity dark:bg-[#FFB3C1] ${selected ? "opacity-100" : "opacity-0"}`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/** Bottom padding the page needs on a phone so the fixed tab bar never covers its last rows. */
export const EVANGELISM_TABS_BOTTOM_SPACE = "pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-12";
