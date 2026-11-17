import type { MonthSummary, PipelineStatus } from "@/lib/api/pipeline";
import { STATUS_META } from "../status";
import { CARD_SURFACE } from "./MonthCard";
import { SETTLED_STATUSES, TIMER_STATUSES, reachedLong } from "./overview-text";

function Count({ status, n }: { status: PipelineStatus; n: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_META[status].dot}`} />
      <span className="font-semibold tabular-nums text-[#111] dark:text-white">{n}</span>
      <span className="text-gray-600 dark:text-white/65">{STATUS_META[status].label}</span>
    </span>
  );
}

/** The whole year: the same breakdown as the month cards, summed by the API across all twelve. */
export function YearStrip({ year, total }: { year: number; total: MonthSummary }) {
  return (
    <section className={`${CARD_SURFACE} p-5`} aria-label={`${year} total`}>
      <h2 className="text-base font-bold text-[#111] dark:text-white">
        {year} total (<span className="tabular-nums">{total.total}</span>)
      </h2>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {TIMER_STATUSES.map((s) => (
          <Count key={s} status={s} n={total.counts[s]} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {SETTLED_STATUSES.map((s) => (
          <Count key={s} status={s} n={total.counts[s]} />
        ))}
      </div>
      <p className="mt-3 text-sm font-medium text-gray-600 dark:text-white/60">{reachedLong(total)}</p>
    </section>
  );
}
