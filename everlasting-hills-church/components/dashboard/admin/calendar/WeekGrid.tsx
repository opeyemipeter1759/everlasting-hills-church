"use client";

import type { CalendarEvent } from "@/lib/api/calendar";
import EventChip from "./EventChip";
import { WEEKDAYS, addDays, eventsForDay, isToday, startOfWeek } from "./calendar-utils";

export default function WeekGrid({
  cursor,
  events,
  onSelectDay,
}: {
  cursor: Date;
  events: CalendarEvent[];
  onSelectDay: (day: Date) => void;
}) {
  const from = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[640px] grid-cols-7 overflow-hidden rounded-2xl border border-[#E7CDD3]/60 dark:border-white/[0.09]">
        {days.map((day) => {
          const dayEvents = eventsForDay(events, day);
          const today = isToday(day);

          return (
            <div key={day.toISOString()} className="border-r border-[#E7CDD3]/40 last:border-r-0 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => onSelectDay(day)}
                className={[
                  "w-full border-b border-[#E7CDD3]/60 px-2 py-2.5 text-center transition-colors dark:border-white/[0.09]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#87102C]/40",
                  today ? "bg-[#FFE8ED] dark:bg-[#87102C]/25" : "bg-[#FFF4F6]/60 hover:bg-[#FFF4F6] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]",
                ].join(" ")}
              >
                <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a7e80] dark:text-white/40">
                  {WEEKDAYS[day.getDay()]}
                </span>
                <span
                  className={[
                    "mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    today ? "bg-[#87102C] text-white" : "text-[#111] dark:text-white/80",
                  ].join(" ")}
                >
                  {day.getDate()}
                </span>
              </button>

              <div className="min-h-[240px] space-y-1 p-1.5">
                {dayEvents.length === 0 ? (
                  <p className="px-1 pt-2 text-center text-[10px] text-[#8a7e80]/60 dark:text-white/20">&mdash;</p>
                ) : (
                  dayEvents.map((e) => <EventChip key={e.id} event={e} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
