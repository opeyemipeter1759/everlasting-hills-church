"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpen, Check, ChevronLeft, ChevronRight, Circle } from "lucide-react";
import WordTabs from "./WordTabs";
import ReadingPlanSelector from "./ReadingPlanSelector";
import { readingHref, useCompletedDays, usePlanDays, useTodayReading } from "@/lib/api/reading-plan";

const PAGE_SIZE = 60;

/**
 * The whole plan, day by day.
 *
 * Every established reading plan publishes its full schedule, and for good
 * reason: seeing what day 200 holds is part of trusting a plan before
 * committing a year to it. It also gives a member who missed a week somewhere
 * to go other than a number, since any day can be opened and read.
 */
export default function PlanSchedule() {
  const params = useSearchParams();
  const subscriptionId = params.get("subscription") || undefined;
  const { data: me, isLoading: meLoading, isError: meError, refetch: retryMe } = useTodayReading(subscriptionId);
  const [pagination, setPagination] = useState({ subscriptionId, page: 1 });
  const page = pagination.subscriptionId === subscriptionId ? pagination.page : 1;
  const setPage = (next: number) => setPagination({ subscriptionId, page: next });
  const { data, isLoading, isError, refetch } = usePlanDays(me?.plan.id, page, PAGE_SIZE);
  const { data: completed, isLoading: completedLoading, isError: completedError, refetch: retryCompleted } = useCompletedDays(me?.subscriptionId);

  if (meLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 xs:px-5 py-8">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
      </div>
    );
  }

  if (meError) {
    return <div className="mx-auto max-w-3xl py-6 pb-24"><WordTabs subscriptionId={subscriptionId} /><div role="alert" className="mt-6 rounded-xl border border-red-200 p-4 text-sm dark:border-red-900">
      Could not load this plan. <button type="button" onClick={() => retryMe()} className="min-h-11 font-semibold text-[#87102C] underline dark:text-[#FFB3C1]">Try again</button>
    </div></div>;
  }

  if (!me) {
    return (
      <div className="mx-auto max-w-3xl py-6 pb-24">
        <WordTabs />
        <div className="mt-10 text-center">
          <BookOpen size={22} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-sm font-semibold text-gray-700 dark:text-white/80">
            You have not chosen a reading plan yet.
          </p>
          <Link
            href="/dashboard/reading/plans"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6E0C24]"
          >
            Choose a plan
          </Link>
          <Link href="/dashboard/reading/overview" className="mt-3 flex min-h-11 items-center justify-center text-sm font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">View your plans and progress</Link>
        </div>
      </div>
    );
  }

  const done = new Set(completed?.dayIndexes ?? []);
  const totalPages = Math.max(1, Math.ceil((data?.meta.total ?? 0) / PAGE_SIZE));

  return (
    <div className="mx-auto min-w-0 max-w-3xl py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-3">
      <WordTabs subscriptionId={me.subscriptionId} />
      <ReadingPlanSelector subscriptionId={me.subscriptionId} page="schedule" />

      <header className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] xs:tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]">
          {me.plan.title}
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#111] dark:text-white">
          The whole plan
        </h1>
        <p className="mt-1 text-sm text-[#8a7e80] dark:text-white/45">
          {me.completedDays} of {me.plan.durationDays} days read. Open any day to read it, ahead or
          behind.
        </p>
      </header>

      {isError || completedError ? (
        <div role="alert" className="mt-6 rounded-xl border border-red-200 p-4 text-sm dark:border-red-900">
          Could not load the schedule and your completed days.{" "}
          <button type="button" onClick={() => { refetch(); retryCompleted(); }} className="min-h-11 font-semibold text-[#87102C] underline dark:text-[#FFB3C1]">Try again</button>
        </div>
      ) : isLoading || completedLoading ? (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : (
        <ol className="mt-6 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 dark:divide-white/[0.06] dark:border-white/10">
          {(data?.days ?? []).map((day) => {
            const isDone = done.has(day.dayIndex);
            const isCurrent = me.status !== "COMPLETED" && day.dayIndex === me.currentDayIndex;
            return (
              <li key={day.dayIndex}>
                <Link
                  href={readingHref(me.subscriptionId, day.dayIndex)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] ${
                    isCurrent ? "bg-[#FFF4F6]/60 dark:bg-[#87102C]/10" : "bg-white dark:bg-white/[0.02]"
                  }`}
                >
                  {isDone ? (
                    <Check size={16} aria-hidden="true" className="flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle size={16} aria-hidden="true" className="flex-shrink-0 text-gray-300 dark:text-white/20" />
                  )}
                  <span className="sr-only">{isDone ? "Read:" : "Not yet read:"}</span>

                  <span className="w-12 flex-shrink-0 text-[11px] font-bold tabular-nums text-gray-400 dark:text-white/35">
                    Day {day.dayIndex}
                  </span>

                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${
                      isDone
                        ? "text-gray-400 dark:text-white/35"
                        : "font-semibold text-[#111] dark:text-white"
                    }`}
                  >
                    {day.referenceLabel}
                  </span>

                  {isCurrent && (
                    <span className="flex-shrink-0 rounded-full bg-[#87102C] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      Today
                    </span>
                  )}

                  <span className="hidden w-14 flex-shrink-0 text-right text-[11px] text-gray-400 dark:text-white/30 sm:block">
                    {day.estimatedMinutes} min
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      {!isError && !completedError && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40 dark:border-white/10 dark:text-white/60"
          >
            <ChevronLeft size={13} /> Earlier
          </button>
          <span className="text-[11px] text-gray-400 dark:text-white/35">
            Days {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, data?.meta.total ?? 0)}
          </span>
          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40 dark:border-white/10 dark:text-white/60"
          >
            Later <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
