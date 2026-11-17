"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PIPELINE_STATUSES, type PipelineStatus } from "@/lib/api/pipeline";
import { MonthBreakdowns } from "./MonthBreakdowns";
import { MonthHeader } from "./MonthHeader";
import { MonthPeople } from "./MonthPeople";

/**
 * One month of the Overview: the people whose first visit fell in it, as they
 * stand today. Nothing pastoral is on this page or in what it loads, because
 * it is likely to be shown in leaders' meetings. The status filter lives in
 * the URL (?status=) so a filtered month can be shared.
 */
export default function OverviewMonth({ year, month }: { year: number; month: number }) {
  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6">
      <MonthHeader year={year} month={month} />
      <MonthBreakdowns year={year} month={month} />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.05]" />}>
        <MonthPeopleWithStatus year={year} month={month} />
      </Suspense>
    </div>
  );
}

function MonthPeopleWithStatus({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const asked = params.get("status") as PipelineStatus | null;
  const status = asked && PIPELINE_STATUSES.includes(asked) ? asked : "";

  function setStatus(next: PipelineStatus | "") {
    const q = new URLSearchParams(params.toString());
    if (next) q.set("status", next);
    else q.delete("status");
    router.replace(q.size ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  return <MonthPeople year={year} month={month} status={status} onStatus={setStatus} />;
}
