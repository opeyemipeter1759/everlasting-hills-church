"use client";

import { CalendarDays, MapPin, Radio } from "lucide-react";
import type { CalendarItem } from "./calendar-grid-utils";
import { formatTime, itemsForDay } from "./calendar-grid-utils";

const KIND_BADGE: Record<CalendarItem["kind"], { label: string; className: string } | null> = {
  service: null,
  event: { label: "Event", className: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300" },
  gathering: { label: "Recurring", className: "bg-[#F6F1F2] text-[#5A4A4D] dark:bg-white/10 dark:text-white/60" },
  personal: { label: "Your calendar", className: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300" },
};

/** Day view: a reading list rather than a grid, so it can carry location and status. */
export default function MemberDayList({ cursor, items }: { cursor: Date; items: CalendarItem[] }) {
  const dayItems = itemsForDay(items, cursor);

  if (dayItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E7CDD3]/60 bg-white px-8 py-16 text-center dark:border-white/[0.09] dark:bg-white/[0.03]">
        <CalendarDays size={26} className="mb-3 text-[#87102C]/40 dark:text-[#FFB3C1]/40" aria-hidden="true" />
        <p className="text-base font-semibold text-[#111] dark:text-white">Nothing scheduled</p>
        <p className="mt-1 text-sm text-[#8a7e80] dark:text-white/45">There is nothing on your calendar this day.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {dayItems.map((item) => {
        const badge = KIND_BADGE[item.kind];
        const body = (
          <div
            className={[
              "flex items-start gap-4 rounded-2xl border border-[#E7CDD3]/60 bg-white p-4 transition-colors dark:border-white/[0.09] dark:bg-white/[0.03]",
              item.htmlLink ? "hover:bg-[#FFF4F6]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40 dark:hover:bg-white/[0.06]" : "",
              item.cancelled ? "opacity-60" : "",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl",
                item.kind === "personal" ? "bg-blue-50 dark:bg-blue-400/15" : "bg-[#FFE8ED] dark:bg-[#87102C]/25",
              ].join(" ")}
            >
              <span className="text-[11px] font-bold text-[#87102C] dark:text-[#FFB3C1]">{formatTime(item.start)}</span>
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={`truncate text-sm font-bold text-[#111] dark:text-white ${item.cancelled ? "line-through" : ""}`}>
                  {item.title}
                </p>
                {item.servingRoles?.length ? (
                  <span className="rounded bg-[#87102C]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#87102C] dark:bg-white/10 dark:text-[#FFB3C1]">
                    Serving
                  </span>
                ) : null}
                {item.isLive && (
                  <span className="flex items-center gap-1 rounded bg-green-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-green-700 dark:text-green-400">
                    <Radio size={10} /> Live
                  </span>
                )}
                {badge && (
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#8a7e80] dark:text-white/45">
                {formatTime(item.start)}
                {item.end ? ` to ${formatTime(item.end)}` : ""}
              </p>
              {item.location && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[#8a7e80] dark:text-white/45">
                  <MapPin size={12} aria-hidden="true" />
                  {item.location}
                </p>
              )}
            </div>
          </div>
        );

        return (
          <li key={item.id}>
            {item.htmlLink ? (
              <a href={item.htmlLink} target="_blank" rel="noopener noreferrer">
                {body}
              </a>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}
