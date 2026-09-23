"use client";

import type { LucideIcon } from "lucide-react";

/**
 * Underlined tabs: the label carries the emphasis, a burgundy rule marks the
 * one you're on, and a count sits beside each so you can see the size of a
 * view before opening it. Scrolls sideways on a phone rather than wrapping.
 */
export function FollowUpTabs<Id extends string>({
  tabs,
  active,
  counts = {},
  label = "Follow Up views",
  onChange,
}: {
  tabs: { id: Id; label: string; icon: LucideIcon }[];
  active: Id;
  counts?: Partial<Record<Id, number>>;
  label?: string;
  onChange: (tab: Id) => void;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-white/10">
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
            className={`group relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors ${
              selected
                ? "text-[#87102C] dark:text-[#FFB3C1]"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <tab.icon
              size={16}
              aria-hidden="true"
              className={selected ? "" : "text-gray-400 transition-colors group-hover:text-gray-600 dark:group-hover:text-gray-300"}
            />
            {tab.label}
            {typeof count === "number" && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums transition-colors ${
                  selected
                    ? "bg-[#87102C] text-white dark:bg-[#FFB3C1] dark:text-[#5E0A1E]"
                    : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/50"
                }`}
              >
                {count}
              </span>
            )}
            {/* The rule sits on the container's border, so it reads as one line. */}
            <span
              aria-hidden="true"
              className={`absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-[#87102C] transition-opacity dark:bg-[#FFB3C1] ${
                selected ? "opacity-100" : "opacity-0"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
