/** Sundays the attendance rate is measured over. */
export const RATE_WINDOW = 8;
/** Sundays missed in a row before someone is flagged. */
export const MISSED_IN_A_ROW = 3;
/** Sundays someone must have had the chance to attend before a rate means anything. */
export const MIN_FOR_RATE = 4;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface RiskSunday {
  id: string;
  scheduledAt: Date;
}

export interface RiskMember {
  id: string;
  joinedAt: Date;
}

export type RiskVerdict =
  | { kind: 'never'; eligible: number }
  | { kind: 'in-a-row'; missed: number; attended: number; eligible: number }
  | { kind: 'low-rate'; attended: number; eligible: number }
  | null;

/**
 * Whether one member needs checking on, judged only on Sundays held since they
 * joined (newest first in `sundays`). Each member lands in at most one group,
 * the most serious first, so nobody is counted twice:
 *   never     no check-in at any service, after three or more Sundays
 *   in-a-row  missed the last three or more Sundays
 *   low-rate  came to fewer than half of the last eight (with four or more to judge by)
 */
export function judgeMember(member: RiskMember, sundays: RiskSunday[], present: Set<string>, everCheckedIn: boolean): RiskVerdict {
  // A Sunday counts for someone who joined any time that day.
  const eligible = sundays.filter((s) => member.joinedAt.getTime() < s.scheduledAt.getTime() + DAY_MS);
  if (eligible.length < MISSED_IN_A_ROW) return null;

  if (!everCheckedIn) return { kind: 'never', eligible: eligible.length };

  let missed = 0;
  while (missed < eligible.length && !present.has(eligible[missed].id)) missed++;

  const recent = eligible.slice(0, RATE_WINDOW);
  const attended = recent.filter((s) => present.has(s.id)).length;

  if (missed >= MISSED_IN_A_ROW) return { kind: 'in-a-row', missed, attended, eligible: recent.length };
  if (recent.length >= MIN_FOR_RATE && attended / recent.length < 0.5) {
    return { kind: 'low-rate', attended, eligible: recent.length };
  }
  return null;
}
