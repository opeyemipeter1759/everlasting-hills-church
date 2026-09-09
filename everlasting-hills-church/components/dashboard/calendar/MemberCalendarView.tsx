"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useMyUpcomingCalendar } from "@/lib/api/calendar";
import { useGatherings } from "@/lib/api/gatherings";
import { useGoogleCalendarEvents, useGoogleCalendarStatus } from "@/lib/api/google-calendar";
import type { CalendarItem, CalendarView } from "./calendar-grid-utils";
import { addDays, addMonths, formatViewTitle } from "./calendar-grid-utils";
import MemberMonthGrid from "./MemberMonthGrid";
import MemberWeekGrid from "./MemberWeekGrid";
import MemberDayList from "./MemberDayList";

const VIEWS: CalendarView[] = ["month", "week", "day"];

const LEGEND: { label: string; className: string }[] = [
  { label: "Service", className: "bg-[#FFE8ED] border-l-[#87102C] dark:bg-[#87102C]/25" },
  { label: "Event", className: "bg-amber-50 border-l-amber-500 dark:bg-amber-400/15" },
  { label: "Recurring", className: "bg-[#F6F1F2] border-l-[#8a7e80] dark:bg-white/[0.04]" },
  { label: "Your calendar", className: "bg-blue-50 border-l-blue-500 dark:bg-blue-400/15" },
];

export default function MemberCalendarView() {
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState<Date>(() => new Date());

  const {
    data: calendarItems,
    isLoading: loadingCalendar,
    isError: calendarErrored,
    isFetching: fetchingCalendar,
    refetch: refetchCalendar,
  } = useMyUpcomingCalendar();
  const { data: gatherings, isLoading: loadingGatherings, isFetching: fetchingGatherings, refetch: refetchGatherings } =
    useGatherings();
  const { data: googleStatus } = useGoogleCalendarStatus();
  const {
    data: personalEvents,
    isLoading: loadingPersonal,
    isError: personalErrored,
    isFetching: fetchingPersonal,
    refetch: refetchPersonal,
  } = useGoogleCalendarEvents(Boolean(googleStatus?.connected));

  const loading = loadingCalendar || loadingGatherings || (Boolean(googleStatus?.connected) && loadingPersonal);
  const refreshing = fetchingCalendar || fetchingGatherings || fetchingPersonal;

  function refreshAll() {
    refetchCalendar();
    refetchGatherings();
    if (googleStatus?.connected) refetchPersonal();
  }

  const items: CalendarItem[] = useMemo(
    () => [
      ...(calendarItems ?? []).map((item) => ({
        id: `${item.kind}-${item.id}`,
        kind: item.kind,
        title: item.title,
        start: item.start,
        end: item.end,
        location: item.location,
        cancelled: item.cancelled,
        servingRoles: item.servingRoles,
        isLive: false,
        htmlLink: null,
      })),
      ...(gatherings ?? [])
        .filter((g) => g.nextOccurrenceAt)
        .map((g) => ({
          id: `gathering-${g.id}`,
          kind: "gathering" as const,
          title: g.title,
          start: g.nextOccurrenceAt as string,
          end: null,
          location: null,
          cancelled: false,
          servingRoles: null,
          isLive: g.isLive,
          htmlLink: null,
        })),
      ...(personalEvents ?? []).map((event) => ({
        id: `personal-${event.id}`,
        kind: "personal" as const,
        title: event.title,
        start: event.start,
        end: event.end,
        location: event.location,
        cancelled: false,
        servingRoles: null,
        isLive: false,
        htmlLink: event.htmlLink,
      })),
    ],
    [calendarItems, gatherings, personalEvents],
  );

  function step(direction: -1 | 1) {
    setCursor((c) =>
      view === "month" ? addMonths(c, direction) : addDays(c, direction * (view === "week" ? 7 : 1)),
    );
  }

  function selectDay(day: Date) {
    setCursor(day);
    setView("day");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight text-[#111] dark:text-white">
            {formatViewTitle(view, cursor)}
          </h2>

          <div
            role="tablist"
            aria-label="Calendar view"
            className="inline-flex rounded-lg border border-[#E7CDD3]/60 bg-white p-0.5 dark:border-white/[0.09] dark:bg-white/[0.03]"
          >
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={[
                  "rounded-md px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40",
                  view === v
                    ? "bg-[#87102C] text-white"
                    : "text-[#8a7e80] hover:text-[#111] dark:text-white/45 dark:hover:text-white",
                ].join(" ")}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={`Previous ${view}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7CDD3]/60 bg-white text-[#111] transition-colors hover:bg-[#FFF4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40 dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.07]"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={`Next ${view}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7CDD3]/60 bg-white text-[#111] transition-colors hover:bg-[#FFF4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40 dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.07]"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date())}
            className="ml-1 rounded-lg border border-[#E7CDD3]/60 bg-white px-3 py-2 text-xs font-semibold text-[#111] transition-colors hover:bg-[#FFF4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40 dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.07]"
          >
            Today
          </button>
          <button
            type="button"
            onClick={refreshAll}
            disabled={refreshing}
            aria-label="Refresh calendar"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[#E7CDD3]/60 bg-white px-3 py-2 text-xs font-semibold text-[#111] transition-colors hover:bg-[#FFF4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40 disabled:opacity-50 dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.07]"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {calendarErrored || personalErrored ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-8 py-14 text-center dark:border-red-500/20 dark:bg-red-500/10"
        >
          <AlertTriangle size={26} className="mb-3 text-red-500 dark:text-red-400" aria-hidden="true" />
          <p className="text-base font-semibold text-red-800 dark:text-red-300">Couldn&apos;t load the calendar</p>
          <p className="mt-1 max-w-md text-sm text-red-600/80 dark:text-red-400/70">
            {personalErrored
              ? "Your personal Google Calendar events could not be loaded — try reconnecting above."
              : "Something went wrong while fetching your calendar."}
          </p>
          <button
            type="button"
            onClick={() => refetchCalendar()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6E0C24]"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : loading ? (
        <div
          aria-busy="true"
          className="h-[420px] animate-pulse rounded-2xl border border-[#E7CDD3]/60 bg-white dark:border-white/[0.09] dark:bg-white/[0.04]"
        >
          <span className="sr-only">Loading calendar...</span>
        </div>
      ) : view === "month" ? (
        <MemberMonthGrid cursor={cursor} items={items} onSelectDay={selectDay} />
      ) : view === "week" ? (
        <MemberWeekGrid cursor={cursor} items={items} onSelectDay={selectDay} />
      ) : (
        <MemberDayList cursor={cursor} items={items} />
      )}

      <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#8a7e80] dark:text-white/40">
        {LEGEND.map((entry) => (
          <span key={entry.label} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm border-l-[3px] ${entry.className}`} />
            {entry.label}
          </span>
        ))}
      </div>
    </div>
  );
}
