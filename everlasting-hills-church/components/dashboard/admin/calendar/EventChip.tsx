"use client";

import Link from "next/link";
import type { CalendarEvent } from "@/lib/api/calendar";
import { formatTime } from "./calendar-utils";

/**
 * One event on the grid. Drafts are muted and dashed so an admin can tell at a glance
 * what the congregation can actually see, since the grid shows both.
 */
export default function EventChip({ event, showTime = true }: { event: CalendarEvent; showTime?: boolean }) {
  const draft = event.status === "DRAFT";

  return (
    <Link
      href={`/dashboard/admin/events/${event.id}`}
      title={`${event.title}${event.venueName ? ` · ${event.venueName}` : ""}${draft ? " (draft)" : ""}`}
      className={[
        "group flex items-center gap-1.5 rounded-md border-l-[3px] px-1.5 py-1 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40",
        draft
          ? "border-l-[#8a7e80] border border-dashed border-[#E7CDD3] bg-[#F6F1F2] hover:bg-[#EFE7E9] dark:border-white/15 dark:border-l-white/30 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
          : "border-l-[#87102C] bg-[#FFE8ED] hover:bg-[#FFD6E0] dark:bg-[#87102C]/25 dark:hover:bg-[#87102C]/40",
      ].join(" ")}
    >
      {event.featured && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500 dark:bg-amber-400"
        />
      )}
      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-tight text-[#111] dark:text-white">
        {showTime && <span className="mr-1 font-normal text-[#8a7e80] dark:text-white/45">{formatTime(event.startAt)}</span>}
        {event.title}
      </span>
      {draft && (
        <span className="flex-shrink-0 rounded bg-[#8a7e80]/15 px-1 text-[9px] font-bold uppercase tracking-wide text-[#8a7e80] dark:bg-white/10 dark:text-white/50">
          Draft
        </span>
      )}
    </Link>
  );
}
