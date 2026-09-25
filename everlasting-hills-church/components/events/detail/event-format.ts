/**
 * Date/time formatting for events, pinned to West Africa Time (Africa/Lagos).
 *
 * Pinning the timeZone keeps output deterministic across the server (often UTC)
 * and the client — both avoiding hydration mismatches and showing the event's
 * intended local time regardless of where it's rendered.
 */
const TZ = "Africa/Lagos";

export function formatEventDate(iso: string, timeZone = TZ): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  });
}

export function formatEventDateShort(iso: string, timeZone = TZ): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  });
}

function dateParts(iso: string, timeZone = TZ): { day: string; month: string; year: string } {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: get("day"), month: get("month"), year: get("year") };
}

/** Short date, or a "start – end" range when the event spans multiple days. */
export function formatEventDateRange(startIso: string, endIso: string | null, timeZone = TZ): string {
  const s = new Date(startIso);
  if (Number.isNaN(s.getTime())) return "";
  if (!endIso) return formatEventDateShort(startIso, timeZone);
  const e = new Date(endIso);
  if (Number.isNaN(e.getTime())) return formatEventDateShort(startIso, timeZone);

  const a = dateParts(startIso, timeZone);
  const b = dateParts(endIso, timeZone);
  if (a.day === b.day && a.month === b.month && a.year === b.year) {
    return formatEventDateShort(startIso, timeZone);
  }
  if (a.year === b.year && a.month === b.month) {
    return `${a.day}–${b.day} ${b.month} ${b.year}`;
  }
  if (a.year === b.year) {
    return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
  }
  return `${a.day} ${a.month} ${a.year} – ${b.day} ${b.month} ${b.year}`;
}

/** "YYYY-MM-DD" for the given instant, in the church's timezone — sortable/comparable as a string. */
function dateKey(iso: string, timeZone = TZ): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone });
}

export type EventTemporalStatus = "ongoing" | "upcoming" | "past";

/**
 * Calendar-day status (ignores time-of-day) in the church's timezone:
 * "upcoming" if the start day hasn't arrived yet, "past" once the end day
 * (or start day, if no end date) has gone by, and "ongoing" for everything
 * in between — i.e. today falls within the event's day span.
 */
export function getEventStatus(startIso: string, endIso: string | null, timeZone = TZ): EventTemporalStatus {
  const today = dateKey(new Date().toISOString(), timeZone);
  const startDay = dateKey(startIso, timeZone);
  const endDay = dateKey(endIso ?? startIso, timeZone);
  if (today < startDay) return "upcoming";
  if (today > endDay) return "past";
  return "ongoing";
}

/** Calendar-day comparison (ignores time-of-day) in the church's timezone. */
export function isPastEventDate(startIso: string, endIso: string | null, timeZone = TZ): boolean {
  return getEventStatus(startIso, endIso, timeZone) === "past";
}

export function formatEventTime(iso: string, timeZone = TZ): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });
}

export function formatEventTimeRange(startIso: string, endIso: string | null, timeZone = TZ): string {
  const s = new Date(startIso);
  if (Number.isNaN(s.getTime())) return "";
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  };
  const start = s.toLocaleTimeString("en-GB", opts);
  if (!endIso) return `${start} (WAT)`;
  const e = new Date(endIso);
  if (Number.isNaN(e.getTime())) return `${start} (WAT)`;
  return `${start} — ${e.toLocaleTimeString("en-GB", opts)} (WAT)`;
}
