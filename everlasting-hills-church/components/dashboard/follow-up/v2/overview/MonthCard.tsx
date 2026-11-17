import Link from "next/link";
import type { MonthSummary, PipelineStatus } from "@/lib/api/pipeline";
import { STATUS_META } from "../status";
import { SETTLED_STATUSES, TIMER_STATUSES, reachedShort } from "./overview-text";

/** The admin dashboard card surface, so these sit with every other dashboard card. */
export const CARD_SURFACE =
  "rounded-2xl border border-[#E7CDD3]/60 bg-white shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:border-white/[0.09] dark:bg-white/[0.05] dark:shadow-none";

function StatusLine({ status, n }: { status: PipelineStatus; n: number }) {
  return (
    <li className="flex items-center gap-2.5">
      <span aria-hidden="true" className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_META[status].dot}`} />
      <span className="w-8 text-right font-semibold tabular-nums text-[#111] dark:text-white">{n}</span>
      <span className="text-gray-600 dark:text-white/65">{STATUS_META[status].label}</span>
    </li>
  );
}

/**
 * One month of first-timers: the people whose first visit fell in it, as they
 * stand today, so the lines always add up to the total. Used for every month
 * on the Overview and for This month on the admin dashboard.
 */
export function MonthCard({
  summary,
  title,
  heading = "Monthly summary",
  href,
  muted = false,
}: {
  summary: MonthSummary;
  /** The month name, or "This month". */
  title: string;
  heading?: string;
  /** Where tapping the card goes. Left out (or muted) the card is not a link. */
  href?: string;
  /** A month that has not started yet. */
  muted?: boolean;
}) {
  const body = (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#87102C] dark:text-[#FFB3C1]">{title}</p>
      <p className="mt-1 text-sm font-bold text-[#111] dark:text-white">
        {heading} (<span className="tabular-nums">{summary.total}</span>)
      </p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {TIMER_STATUSES.map((s) => (
          <StatusLine key={s} status={s} n={summary.counts[s]} />
        ))}
        <li role="separator" aria-hidden="true" className="!my-2.5 border-t border-[#E7CDD3]/50 dark:border-white/[0.08]" />
        {SETTLED_STATUSES.map((s) => (
          <StatusLine key={s} status={s} n={summary.counts[s]} />
        ))}
      </ul>
      <p className="mt-3 text-xs font-medium text-gray-500 dark:text-white/50">{muted ? "Not started yet" : reachedShort(summary)}</p>
    </>
  );

  if (muted || !href) {
    return (
      <div className={`${CARD_SURFACE} p-4 ${muted ? "opacity-50" : ""}`} aria-disabled={muted || undefined}>
        {body}
      </div>
    );
  }
  return (
    <Link
      href={href}
      className={`${CARD_SURFACE} block p-4 transition-colors hover:border-[#87102C]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87102C] dark:hover:border-white/25`}
    >
      {body}
    </Link>
  );
}
