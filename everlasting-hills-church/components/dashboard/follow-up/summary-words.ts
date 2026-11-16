import type { FollowUpSummary } from "./useFollowUpSummary";

/** Words and figures; the header sets each number in bold. */
export type Words = (string | number)[];

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** "a", "a and b", "a, b and c" — each item already a run of words. */
function joinAnd(items: Words[]): Words {
  return items.flatMap((item, i) => [...(i === 0 ? [] : i === items.length - 1 ? [" and "] : [", "]), ...item]);
}

/** Who is on the Master list, by where they stand. */
export function rollWords(s: Pick<FollowUpSummary, "followingUp" | "firstTimers" | "secondTimers" | "thirdTimers" | "away">): Words {
  if (s.followingUp === 0) return ["Nobody is being followed up right now."];
  const groups: Words[] = (
    [
      [s.firstTimers, plural(s.firstTimers, " first timer", " first timers")],
      [s.secondTimers, plural(s.secondTimers, " second timer", " second timers")],
      [s.thirdTimers, plural(s.thirdTimers, " third timer", " third timers")],
      [s.away, plural(s.away, " member who's been away", " members who've been away")],
    ] as [number, string][]
  ).filter(([n]) => n > 0);
  if (groups.length === 1) return ["The team is following up ", ...groups[0], "."];
  return ["The team is following up ", s.followingUp, plural(s.followingUp, " person", " people"), ": ", ...joinAnd(groups), "."];
}

/** What needs doing on the Master list this week. */
export function weekWords(w: NonNullable<FollowUpSummary["thisWeek"]>): Words {
  const fresh: Words = w.newThisWeek > 0 ? [w.newThisWeek, plural(w.newThisWeek, " is new this week", " are new this week")] : [];
  if (w.unassigned === 0 && w.quiet === 0) {
    return [...fresh, ...(fresh.length ? [". "] : []), "Everyone has someone assigned and activity logged this week."];
  }
  const clauses: Words[] = [
    fresh,
    w.unassigned > 0 ? [w.unassigned, plural(w.unassigned, " has nobody assigned yet", " have nobody assigned yet")] : [],
    w.quiet > 0 ? [w.quiet, plural(w.quiet, " has had no activity logged in the past week", " have had no activity logged in the past week")] : [],
  ].filter((clause) => clause.length > 0);
  return [...joinAnd(clauses), "."];
}
