"use client";

import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { CalendarEvent } from "@/lib/api/calendar";
import { eventsForDay, formatTime } from "./calendar-utils";

/** Day view: a reading list rather than a grid, so it can carry venue and status. */
export default function DayList({ cursor, events }: { cursor: Date; events: CalendarEvent[] }) {
  const dayEvents = eventsForDay(events, cursor);

  if (dayEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E7CDD3]/60 bg-white px-8 py-16 text-center dark:border-white/[0.09] dark:bg-white/[0.03]">
        <CalendarDays size={26} className="mb-3 text-[#87102C]/40 dark:text-[#FFB3C1]/40" aria-hidden="true" />
        <p className="text-base font-semibold text-[#111] dark:text-white">Nothing scheduled</p>
        <p className="mt-1 text-sm text-[#8a7e80] dark:text-white/45">
          There are no events on this day.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {dayEvents.map((e) => {
        const draft = e.status === "DRAFT";
        return (
          <li key={e.id}>
            <Link
              href={`/dashboard/admin/events/${e.id}`}
              className="flex items-start gap-4 rounded-2xl border border-[#E7CDD3]/60 bg-white p-4 transition-colors hover:bg-[#FFF4F6]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40 dark:border-white/[0.09] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
            >
              <span
                className={[
                  "flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl",
                  draft ? "bg-[#F6F1F2] dark:bg-white/[0.06]" : "bg-[#FFE8ED] dark:bg-[#87102C]/25",
                ].join(" ")}
              >
                <span className="text-[11px] font-bold text-[#87102C] dark:text-[#FFB3C1]">
                  {formatTime(e.startAt)}
                </span>
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-bold text-[#111] dark:text-white">{e.title}</p>
                  {e.featured && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                      Featured
                    </span>
                  )}
                  {draft && (
                    <span className="rounded bg-[#8a7e80]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#8a7e80] dark:bg-white/10 dark:text-white/50">
                      Draft
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-[#8a7e80] dark:text-white/45">
                  {formatTime(e.startAt)}
                  {e.endAt ? ` to ${formatTime(e.endAt)}` : ""}
                </p>
                {e.venueName && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[#8a7e80] dark:text-white/45">
                    <MapPin size={12} aria-hidden="true" />
                    {e.venueName}
                  </p>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
