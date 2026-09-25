"use client";

import type { LucideIcon } from "lucide-react";

/**
 * On a phone, a bar fixed to the bottom of the screen like the Bible plan's
 * tabs (WordTabs): icon over label, the open tab filled burgundy, sitting
 * over the dashboard's own bottom nav while the page is open. The page must
 * leave room for it — see TABS_BOTTOM_SPACE.
 *
 * From `sm` up, underlined tabs: the label carries the emphasis, a burgundy
 * rule marks the one you're on, and a count sits beside each so you can see
 * the size of a view before opening it.
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
    <div
      role="tablist"
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-gray-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-gray-950 sm:static sm:z-auto sm:gap-1 sm:overflow-x-auto sm:border-b sm:border-t-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:shadow-none sm:no-scrollbar sm:dark:bg-transparent"
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
            onClick={() => onChange(tab.id)}
            className={`group relative my-1.5 flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-center text-[11px] font-bold leading-tight transition-colors sm:my-0 sm:min-h-0 sm:flex-none sm:flex-row sm:gap-2 sm:whitespace-nowrap sm:rounded-none sm:px-4 sm:py-3 sm:text-sm sm:font-semibold ${
              selected
                ? "bg-[#87102C] text-white shadow-sm sm:bg-transparent sm:text-[#87102C] sm:shadow-none sm:dark:text-[#FFB3C1]"
                : "text-gray-500 hover:text-gray-900 dark:text-white/45 dark:hover:text-white sm:dark:text-gray-400"
            }`}
          >
            <span className="relative">
              <tab.icon
                size={16}
                aria-hidden="true"
                className={selected ? "" : "sm:text-gray-400 sm:transition-colors sm:group-hover:text-gray-600 sm:dark:group-hover:text-gray-300"}
              />
              {typeof count === "number" && (
                <span
                  className={`absolute -right-4 -top-2 min-w-[1.1rem] rounded-full px-1 text-[10px] font-bold leading-4 tabular-nums sm:hidden ${
                    selected ? "bg-white text-[#87102C]" : "bg-[#87102C] text-white dark:bg-[#FFB3C1] dark:text-[#5E0A1E]"
                  }`}
                >
                  {count}
                </span>
              )}
            </span>
            <span className="line-clamp-2">{tab.label}</span>
            {typeof count === "number" && (
              <span
                className={`hidden rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums transition-colors sm:inline ${
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
              className={`absolute inset-x-3 -bottom-px hidden h-[2px] rounded-full bg-[#87102C] transition-opacity dark:bg-[#FFB3C1] sm:block ${
                selected ? "opacity-100" : "opacity-0"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

/** Bottom padding a page needs on a phone so the fixed tab bar never covers its last rows. */
export const TABS_BOTTOM_SPACE = "pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-0";
