import { addDays, daysBetween } from './local-date.util';

/**
 * Streaks, computed on write and never on read.
 *
 * A read time calculation would have to decide what "today" means for a member
 * who has not opened the app, which makes the number drift with whoever is
 * looking. Writing it means the value in the row is the value, and the day
 * index carries the plan rather than the calendar.
 */

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  /** Member local dates, yyyy-mm-dd. */
  lastReadOn: string | null;
  graceUsedOn: string | null;
}

/** One free miss per 30 days. */
export const GRACE_WINDOW_DAYS = 30;

/**
 * Advances a streak for a completion recorded on `today`.
 *
 * The grace day is the point of this function. One missed day resetting a sixty
 * day streak to zero is the largest single driver of abandonment in habit
 * products, and in a church it produces shame as well, which is the wrong lever
 * entirely. One free miss per thirty days, applied silently. It is never
 * announced as "you used your grace", because that turns a kindness into a
 * scolding.
 */
export function advanceStreak(state: StreakState, today: string): StreakState {
  const { lastReadOn, graceUsedOn } = state;

  // Already read today. Completing a second day's reading does not compound the
  // streak, or catching up on four days would read as four days of faithfulness.
  if (lastReadOn === today) return state;

  let currentStreak: number;
  let nextGraceUsedOn = graceUsedOn;

  if (lastReadOn === null) {
    currentStreak = 1;
  } else if (lastReadOn === addDays(today, -1)) {
    currentStreak = state.currentStreak + 1;
  } else if (lastReadOn === addDays(today, -2) && graceIsAvailable(graceUsedOn, today)) {
    currentStreak = state.currentStreak + 1;
    nextGraceUsedOn = today;
  } else {
    // Two or more days missed, or a gap the grace cannot cover.
    currentStreak = 1;
  }

  return {
    currentStreak,
    longestStreak: Math.max(state.longestStreak, currentStreak),
    lastReadOn: today,
    graceUsedOn: nextGraceUsedOn,
  };
}

function graceIsAvailable(graceUsedOn: string | null, today: string): boolean {
  if (graceUsedOn === null) return true;
  return daysBetween(graceUsedOn, today) > GRACE_WINDOW_DAYS;
}

/**
 * Pace, for encouragement only.
 *
 * Never rendered as "you are 7 days behind". The day index model means there is
 * no debt to display: a member is on day 43 because they have read 43 days, not
 * because the calendar says so. This exists so the UI can offer an optional
 * "read two days today" when somebody has drifted, and for analytics.
 */
export function paceDelta(daysSinceStarted: number, completedDays: number): number {
  return daysSinceStarted - completedDays;
}
