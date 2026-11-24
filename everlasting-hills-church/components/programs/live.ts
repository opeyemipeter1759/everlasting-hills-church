import type { ProgramCard } from "@/lib/programs";

/**
 * "Live now" and "next" from the instants the API sent. Nothing here works
 * out a date from a rule: it only compares now against windows the server
 * computed in Lagos, so a page left open stays right without a refetch.
 */
const TZ = "Africa/Lagos";
const DAY = 86_400_000;

export function liveNow(p: Pick<ProgramCard, "occurrences">, now: Date): { live: boolean; session: string | null; endsAt: Date | null } {
  const t = now.getTime();
  const o = p.occurrences.find((w) => Date.parse(w.start) <= t && t < Date.parse(w.end));
  if (!o) return { live: false, session: null, endsAt: null };
  const s = o.sessions.find((w) => Date.parse(w.start) <= t && t < Date.parse(w.end));
  return { live: true, session: s?.name ?? null, endsAt: new Date(o.end) };
}

export function nextStart(p: Pick<ProgramCard, "occurrences">, now: Date): Date | null {
  const o = p.occurrences.find((w) => Date.parse(w.start) > now.getTime());
  return o ? new Date(o.start) : null;
}

/** The calendar date in Lagos, as a UTC midnight, for counting whole days. */
const lagosDay = (d: Date) => {
  const [y, m, day] = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d).split("-").map(Number);
  return Date.UTC(y, m - 1, day);
};

export const clockLagos = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).format(d).replace(/\s/g, "").toUpperCase().replace(/(AM|PM)$/, " $1");

export const dateLagos = (d: Date, withYear = false) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", ...(withYear ? { year: "numeric" } : {}) }).format(d);

/** "Tonight at 10:00 PM", "Tomorrow at 10:00 PM", "Thursday at 10:00 PM", "In 6 days", "On 30 November". */
export function whenText(start: Date, now: Date): string {
  const days = Math.round((lagosDay(start) - lagosDay(now)) / DAY);
  const time = clockLagos(start);
  const evening = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", hour12: false }).format(start)) >= 18;
  if (days <= 0) return `${evening ? "Tonight" : "Today"} at ${time}`;
  if (days === 1) return `Tomorrow at ${time}`;
  if (days < 7) return `${new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long" }).format(start)} at ${time}`;
  if (days <= 31) return `In ${days} days`;
  return `On ${new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "long" }).format(start)}`;
}

/** One line of "the rhythm of the house": what is on now, what is next, or when it will be announced. */
export function rhythmLine(p: ProgramCard, now: Date): { text: string; live: boolean } {
  const live = liveNow(p, now);
  if (live.live) return { text: live.session ? `${p.name} is live. ${live.session} is on now` : `${p.name} is live now`, live: true };
  const next = nextStart(p, now);
  if (next) return { text: `${p.name}: ${whenText(next, now).replace(/^In /, "in ").replace(/^On /, "on ")}`, live: false };
  return { text: `${p.name}: ${p.schedule}`, live: false };
}

/** Programs in the order the strip shows them: live first, then soonest, then still to be announced. */
export function byRhythm(programs: ProgramCard[], now: Date): ProgramCard[] {
  const rank = (p: ProgramCard) => (liveNow(p, now).live ? 0 : nextStart(p, now)?.getTime() ?? Number.MAX_SAFE_INTEGER);
  return [...programs].sort((a, b) => rank(a) - rank(b));
}
