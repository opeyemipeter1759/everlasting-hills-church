import type { MonthSummary, PipelineStatus } from "@/lib/api/pipeline";

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The status lines above the divider, and the two below it. */
export const TIMER_STATUSES: PipelineStatus[] = ["FIRST_TIMER", "SECOND_TIMER", "THIRD_TIMER"];
export const SETTLED_STATUSES: PipelineStatus[] = ["INTEGRATED", "OPTED_OUT"];

export const OVERVIEW_PATH = "/dashboard/follow-up/overview";

/** The month page, e.g. /dashboard/follow-up/overview/2026/01. */
export function monthHref(year: number, month: number): string {
  return `${OVERVIEW_PATH}/${year}/${String(month).padStart(2, "0")}`;
}

/** The church's year and month right now (Lagos is UTC+1 all year). */
export function lagosNow(now = new Date()): { year: number; month: number } {
  const local = new Date(now.getTime() + 60 * 60 * 1000);
  return { year: local.getUTCFullYear(), month: local.getUTCMonth() + 1 };
}

/** True for a month that has not started yet in Lagos. */
export function isFutureMonth(year: number, month: number, now = new Date()): boolean {
  const today = lagosNow(now);
  return year > today.year || (year === today.year && month > today.month);
}

const percent = (m: MonthSummary) => Math.round((m.reached48 / m.due48) * 100);

/** The 48-hour line on a month card. */
export function reachedShort(m: MonthSummary): string {
  if (!m.tracked) return "Not tracked";
  if (m.due48 === 0) return "Nobody due in 48h yet";
  return `${percent(m)}% reached in 48h`;
}

/** The 48-hour line on the year strip and the month page header. */
export function reachedLong(m: MonthSummary): string {
  if (!m.tracked) return "Not tracked";
  if (m.due48 === 0) return "Nobody is due a 48-hour contact yet";
  return `${m.reached48} of ${m.due48} reached within 48 hours (${percent(m)}%)`;
}
