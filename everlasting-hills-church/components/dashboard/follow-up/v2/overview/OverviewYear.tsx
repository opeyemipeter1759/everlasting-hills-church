"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { usePipelineYear } from "@/lib/api/pipeline";
import { MonthCard } from "./MonthCard";
import { YearStrip } from "./YearStrip";
import { MONTH_NAMES, isFutureMonth, lagosNow, monthHref } from "./overview-text";

/**
 * The year at a glance: a year strip and twelve month cards, January to
 * December. The year lives in the URL (?year=) and defaults to this year.
 * Self-contained, so it can be a page of its own or a tab on the Follow Up board.
 */
export default function OverviewYear() {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <OverviewYearInner />
    </Suspense>
  );
}

function OverviewYearInner() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const thisYear = lagosNow().year;
  const asked = Number(params.get("year"));
  const year = Number.isInteger(asked) && asked >= 2000 && asked <= thisYear ? asked : thisYear;
  const query = usePipelineYear(year);
  const firstYear = Math.min(query.data?.firstYear ?? thisYear, year);
  const years = Array.from({ length: thisYear - firstYear + 1 }, (_, i) => String(thisYear - i));

  function pick(next: string) {
    const q = new URLSearchParams(params.toString());
    q.set("year", next);
    router.replace(`${pathname}?${q}`, { scroll: false });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="overview-year" className="text-sm font-semibold text-[#111] dark:text-white">
          Year
        </label>
        <Select
          id="overview-year"
          aria-label="Year"
          value={String(year)}
          onChange={pick}
          options={years.map((y) => ({ value: y, label: y }))}
          className="h-10 min-w-[7rem] rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#111] dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
        />
      </div>

      {query.isLoading && <OverviewSkeleton />}
      {query.isError && (
        <p className="rounded-2xl border border-dashed border-gray-300 px-5 py-8 text-center text-sm text-gray-500 dark:border-white/15 dark:text-white/50">
          The overview could not load. Check your connection and try again.
        </p>
      )}
      {query.data && (
        <>
          <YearStrip year={year} total={query.data.total} />
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label={`Months of ${year}`}>
            {query.data.months.map((m, i) => {
              const future = isFutureMonth(year, i + 1);
              return (
                <li key={m.month}>
                  <MonthCard summary={m} title={MONTH_NAMES[i]} href={monthHref(year, i + 1)} muted={future} />
                </li>
              );
            })}
          </ol>
          <p className="text-xs text-gray-500 dark:text-white/45">
            A month holds the people whose first visit fell in it, as they stand today. Tap a month to see who they are.
          </p>
        </>
      )}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading the overview">
      <div className="h-36 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.05]" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.05]" />
        ))}
      </div>
    </div>
  );
}
