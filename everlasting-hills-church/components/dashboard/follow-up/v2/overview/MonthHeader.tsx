"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePipelineYear } from "@/lib/api/pipeline";
import { MONTH_NAMES, OVERVIEW_PATH, reachedLong } from "./overview-text";

/** Month and year, the way back to the year, and the month's 48-hour line (from the same query as its card). */
export function MonthHeader({ year, month }: { year: number; month: number }) {
  const { data } = usePipelineYear(year);
  const summary = data?.months[month - 1];

  return (
    <header className="space-y-2">
      <Link
        href={`${OVERVIEW_PATH}?year=${year}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-[#111] dark:text-white/55 dark:hover:text-white"
      >
        <ArrowLeft size={15} aria-hidden="true" /> {year} overview
      </Link>
      <h1 className="text-2xl font-bold text-[#111] dark:text-white">
        {MONTH_NAMES[month - 1]} {year}
      </h1>
      <p className="text-sm text-gray-600 dark:text-white/60">
        {summary ? (
          <>
            <span className="tabular-nums">{summary.total}</span> {summary.total === 1 ? "first-timer" : "first-timers"} first came this month.{" "}
            {reachedLong(summary)}
          </>
        ) : (
          <span className="inline-block h-4 w-64 animate-pulse rounded bg-gray-100 align-middle dark:bg-white/[0.06]" />
        )}
      </p>
    </header>
  );
}
