"use client";

import { usePipelineYear } from "@/lib/api/pipeline";
import { CARD_SURFACE, MonthCard } from "@/components/dashboard/follow-up/v2/overview/MonthCard";
import { MONTH_NAMES, OVERVIEW_PATH, lagosNow } from "@/components/dashboard/follow-up/v2/overview/overview-text";

/**
 * This month's first-timers: the same card as each month on the follow-up
 * Overview, from the same query, linking to the Overview.
 */
export default function ThisMonthCard() {
  const { year, month } = lagosNow();
  const { data, isLoading, isError } = usePipelineYear(year);
  const summary = data?.months[month - 1];

  if (isLoading) return <div className={`${CARD_SURFACE} h-56 animate-pulse`} aria-label="Loading this month" />;
  if (isError || !summary) {
    return (
      <div className={`${CARD_SURFACE} p-5 text-sm text-gray-500 dark:text-white/45`}>This month&apos;s first-timers could not load.</div>
    );
  }
  return <MonthCard summary={summary} title={`This month, ${MONTH_NAMES[month - 1]} ${year}`} href={`${OVERVIEW_PATH}?year=${year}`} />;
}
