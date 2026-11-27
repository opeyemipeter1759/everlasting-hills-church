import type { FollowUpSummary } from "./useFollowUpSummary";

/** Words and figures; the header sets each number in bold. */
export type Words = (string | number)[];

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** "a", "a and b", "a, b and c": each item already a run of words. */
function joinAnd(items: Words[]): Words {
  return items.flatMap((item, i) => [...(i === 0 ? [] : i === items.length - 1 ? [" and "] : [", "]), ...item]);
}

/** Who is still being followed up, by how many times they have come. Every figure is the API's. */
export function rollWords(s: Pick<FollowUpSummary, "followingUp" | "firstTimers" | "secondTimers" | "thirdTimers">, who: "team" | "you" = "team"): Words {
  if (s.followingUp === 0) return [who === "you" ? "Nobody is assigned to you to follow up right now." : "Nobody is being followed up right now."];
  const lead = who === "you" ? "You are following up " : "The team is following up ";
  const groups: Words[] = (
    [
      [s.firstTimers, plural(s.firstTimers, " first timer", " first timers")],
      [s.secondTimers, plural(s.secondTimers, " second timer", " second timers")],
      [s.thirdTimers, plural(s.thirdTimers, " third timer", " third timers")],
    ] as [number, string][]
  ).filter(([n]) => n > 0);
  if (groups.length === 1) return [lead, ...groups[0], "."];
  return [lead, s.followingUp, plural(s.followingUp, " person", " people"), ": ", ...joinAnd(groups), "."];
}

/** What needs doing this week, among the people still being followed up. */
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

/** A team member's own week: who is still waiting for them, and what they have logged this month. */
export function myWords(m: { waitingFirstContact: number; contactsThisMonth: number }): Words {
  const waiting: Words = m.waitingFirstContact > 0
    ? [m.waitingFirstContact, plural(m.waitingFirstContact, " is still waiting for your first contact", " are still waiting for your first contact")]
    : ["Everyone has had a first contact from you"];
  return [...waiting, ", and you have logged ", m.contactsThisMonth, plural(m.contactsThisMonth, " contact", " contacts"), " this month."];
}
