/** How often a member has missed the services that counted for them. */
export interface AbsenceSummary {
  /** Services they had no check-in for. */
  missed: number;
  /** Services held since they joined, out of which `missed` is counted. */
  total: number;
  /** Whether they missed the most recent of those services. */
  missedLatest: boolean;
}

/** A service that counts: a past Sunday or Wednesday where attendance was taken. */
export interface CountedService {
  id: string;
  /** End of that service's day (ms), so someone who joined on the day counts it. */
  dayEndMs: number;
}

/**
 * One member's absences. `services` must be newest first; only those held
 * after the member joined count, since nobody can miss a service from before
 * they were part of the church. Null when no service has counted for them yet.
 */
export function summariseAbsence(
  joinedAtMs: number,
  services: CountedService[],
  attended: Set<string>,
): AbsenceSummary | null {
  const eligible = Number.isNaN(joinedAtMs) ? services : services.filter((s) => s.dayEndMs > joinedAtMs);
  if (eligible.length === 0) return null;
  const missed = eligible.filter((s) => !attended.has(s.id)).length;
  return { missed, total: eligible.length, missedLatest: !attended.has(eligible[0].id) };
}
