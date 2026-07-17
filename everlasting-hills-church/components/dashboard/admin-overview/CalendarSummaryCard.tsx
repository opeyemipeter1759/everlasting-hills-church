"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { useCalendarSummary, type CalendarEvent } from "@/lib/api/calendar";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";

/**
 * Calendar summary for the superadmin home: the next few published events plus
 * week/month/draft counts. Self-fetching, like FollowUpCard, so it reads real events
 * without going through the (still mock) dashboard data loader.
 */
export default function CalendarSummaryCard(chrome: DashboardCardChrome) {
  const { data, isLoading, isError } = useCalendarSummary();

  return (
    <DashboardCard kicker="Calendar" title="Church Calendar" icon={CalendarDays} {...chrome}>
      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <span className="sr-only">Loading calendar…</span>
          <div className="h-14 animate-pulse rounded-xl bg-[#FFF4F6] dark:bg-white/[0.04]" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-[#FFF4F6] dark:bg-white/[0.04]" />
          ))}
        </div>
      ) : isError || !data ? (
        <p className="py-6 text-center text-sm text-[#8a7e80] dark:text-white/40">
          Couldn&apos;t load the calendar.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Counts */}
          <div className="grid grid-cols-3 gap-2">
            <Stat label="This week" value={data.counts.thisWeek} />
            <Stat label="This month" value={data.counts.thisMonth} />
            <Stat label="Drafts" value={data.counts.drafts} muted />
          </div>

          {/* Next up */}
          {data.upcoming.length === 0 ? (
            <p className="py-5 text-center text-sm text-[#8a7e80] dark:text-white/40">
              No upcoming events scheduled.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.upcoming.map((ev) => (
                <li key={ev.id}>
                  <Link
                    href={`/dashboard/admin/events/${ev.id}`}
                    className="flex items-center gap-3 rounded-xl border border-[#E7CDD3]/50 bg-[#FFF4F6]/50 px-3 py-2.5 transition-colors hover:bg-[#FFE8ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40 dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:bg-white/[0.07]"
                  >
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25">
                      <CalendarDays size={16} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#111] dark:text-white">{ev.title}</p>
                      <p className="text-xs text-[#8a7e80] dark:text-white/45">{formatWhen(ev)}</p>
                    </div>
                    <ChevronRight size={14} className="flex-shrink-0 text-[#8a7e80]/50 dark:text-white/25" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/dashboard/admin/calendar"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]"
          >
            Open full calendar
            <ChevronRight size={13} aria-hidden="true" />
          </Link>
        </div>
      )}
    </DashboardCard>
  );
}

function Stat({ label, value, muted = false }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="rounded-xl border border-[#E7CDD3]/50 bg-white px-3 py-2.5 text-center dark:border-white/[0.07] dark:bg-white/[0.03]">
      <p
        className={[
          "text-xl font-extrabold leading-none",
          muted ? "text-[#8a7e80] dark:text-white/40" : "text-[#87102C] dark:text-[#FFB3C1]",
        ].join(" ")}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#8a7e80] dark:text-white/40">
        {label}
      </p>
    </div>
  );
}

/** "Sun 19 Jul · 09:00", or "Today · 09:00" when it lands on today. */
function formatWhen(ev: CalendarEvent): string {
  const start = new Date(ev.startAt);
  const now = new Date();
  const sameDay =
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate();

  const time = start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Today · ${time}`;

  const date = start.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return `${date} · ${time}`;
}
