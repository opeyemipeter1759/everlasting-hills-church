"use client";

import type { CalendarItem } from "./calendar-grid-utils";
import { WEEKDAYS, itemsForDay, isToday, monthMatrix } from "./calendar-grid-utils";
import MemberEventChip from "./MemberEventChip";

/** How many chips fit in a cell before collapsing into a "+N more" affordance. */
const MAX_CHIPS = 3;

export default function MemberMonthGrid({
  cursor,
  items,
  onSelectDay,
}: {
  cursor: Date;
  items: CalendarItem[];
  onSelectDay: (day: Date) => void;
}) {
  const weeks = monthMatrix(cursor);
  const month = cursor.getMonth();

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E7CDD3]/60 dark:border-white/[0.09]">
      <div className="grid grid-cols-7 border-b border-[#E7CDD3]/60 bg-[#FFF4F6]/60 dark:border-white/[0.09] dark:bg-white/[0.03]">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a7e80] dark:text-white/40"
          >
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weeks.flat().map((day) => {
          const dayItems = itemsForDay(items, day);
          const outside = day.getMonth() !== month;
          const today = isToday(day);
          const overflow = dayItems.length - MAX_CHIPS;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              aria-label={`${day.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}, ${dayItems.length} item${dayItems.length === 1 ? "" : "s"}`}
              className={[
                "min-h-[86px] border-b border-r border-[#E7CDD3]/40 p-1.5 text-left align-top transition-colors sm:min-h-[112px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#87102C]/40",
                "dark:border-white/[0.06]",
                outside
                  ? "bg-[#FAF7F8] hover:bg-[#F4EEF0] dark:bg-white/[0.01] dark:hover:bg-white/[0.03]"
                  : "bg-white hover:bg-[#FFF4F6]/70 dark:bg-transparent dark:hover:bg-white/[0.04]",
              ].join(" ")}
            >
              <span
                className={[
                  "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                  today
                    ? "bg-[#87102C] text-white"
                    : outside
                      ? "text-[#8a7e80]/50 dark:text-white/20"
                      : "text-[#111] dark:text-white/80",
                ].join(" ")}
              >
                {day.getDate()}
              </span>

              <div className="space-y-1">
                {dayItems.slice(0, MAX_CHIPS).map((item) => (
                  <MemberEventChip key={item.id} item={item} />
                ))}
                {overflow > 0 && (
                  <span className="block px-1 text-[10px] font-semibold text-[#87102C] dark:text-[#FFB3C1]">
                    +{overflow} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
