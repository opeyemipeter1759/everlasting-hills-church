"use client";

import type { LucideIcon } from "lucide-react";

/**
 * Underlined tabs that stay pinned under the page title while you scroll. On a
 * phone they scroll sideways rather than squeezing six labels into one row.
 */
export function EvangelismTabs<Id extends string>({
  tabs,
  active,
  counts = {},
  onChange,
}: {
  tabs: { id: Id; label: string; icon: LucideIcon }[];
  active: Id;
  counts?: Partial<Record<Id, number>>;
  onChange: (tab: Id) => void;
}) {
  return (
    <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur dark:bg-gray-950/95">
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
              className={`relative flex h-12 shrink-0 items-center gap-2 px-3 text-sm font-medium transition-colors sm:px-4 ${
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
  );
}
