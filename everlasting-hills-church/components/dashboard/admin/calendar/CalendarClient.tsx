"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useCalendarEvents } from "@/lib/api/calendar";
import DayList from "./DayList";
import MonthGrid from "./MonthGrid";
import WeekGrid from "./WeekGrid";
import {
  addDays,
  addMonths,
  formatViewTitle,
  toLocalInputValue,
  viewRange,
  type CalendarView,
} from "./calendar-utils";

const VIEWS: CalendarView[] = ["month", "week", "day"];

/**
 * Church calendar. Reads the same events as /dashboard/admin/events (drafts included)
 * and links every chip back to that event, so the calendar is a second view onto the
 * events module rather than a separate store.
 */
export default function CalendarClient() {
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState<Date>(() => new Date());

  // Recomputed per view+cursor; the ISO bounds are the query key, so paging refetches.
  const { from, to } = useMemo(() => viewRange(view, cursor), [view, cursor]);
  const { data: events, isLoading, isError, error, refetch, isFetching } = useCalendarEvents(
    from.toISOString(),
    to.toISOString(),
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

  const list = events ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.32em] text-[#87102C] dark:text-[#FFB3C1]">
              Church Calendar
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111] dark:text-white">
              {formatViewTitle(view, cursor)}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/admin/events?new=1"
              className="inline-flex items-center gap-2 rounded-lg bg-[#87102C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6E0C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40"
            >
              <Plus size={15} aria-hidden="true" />
              Add event
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Paging */}
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
            {isFetching && !isLoading && (
              <RefreshCw size={13} className="ml-1 animate-spin text-[#8a7e80] dark:text-white/30" aria-hidden="true" />
            )}
          </div>

          {/* View switch */}
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
      </div>

      {/* Body */}
      {isError ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-8 py-14 text-center dark:border-red-500/20 dark:bg-red-500/10"
        >
          <AlertTriangle size={26} className="mb-3 text-red-500 dark:text-red-400" aria-hidden="true" />
          <p className="text-base font-semibold text-red-800 dark:text-red-300">Couldn&apos;t load the calendar</p>
          <p className="mt-1 max-w-md text-sm text-red-600/80 dark:text-red-400/70">
            {(error as { message?: string } | null)?.message ?? "Something went wrong while fetching events."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6E0C24]"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <div
          aria-busy="true"
          className="h-[520px] animate-pulse rounded-2xl border border-[#E7CDD3]/60 bg-white dark:border-white/[0.09] dark:bg-white/[0.04]"
        >
          <span className="sr-only">Loading calendar…</span>
        </div>
      ) : view === "month" ? (
        <MonthGrid cursor={cursor} events={list} onSelectDay={selectDay} />
      ) : view === "week" ? (
        <WeekGrid cursor={cursor} events={list} onSelectDay={selectDay} />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href={`/dashboard/admin/events?new=1&date=${encodeURIComponent(toLocalInputValue(cursor))}`}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E7CDD3]/60 bg-white px-3.5 py-2 text-xs font-semibold text-[#87102C] transition-colors hover:bg-[#FFF4F6] dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-[#FFB3C1] dark:hover:bg-white/[0.07]"
            >
              <Plus size={13} aria-hidden="true" />
              Add event on this day
            </Link>
          </div>
          <DayList cursor={cursor} events={list} />
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#8a7e80] dark:text-white/40">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm border-l-[3px] border-l-[#87102C] bg-[#FFE8ED] dark:bg-[#87102C]/25" />
          Published
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm border border-dashed border-[#E7CDD3] bg-[#F6F1F2] dark:border-white/15 dark:bg-white/[0.04]" />
          Draft (not public)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
          Featured
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <CalendarDays size={12} aria-hidden="true" />
          {list.length} event{list.length === 1 ? "" : "s"} in view
        </span>
      </div>
    </div>
  );
}
