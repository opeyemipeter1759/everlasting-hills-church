/**
 * Date/time formatting for events, pinned to West Africa Time (Africa/Lagos).
 *
 * Pinning the timeZone keeps output deterministic across the server (often UTC)
 * and the client — both avoiding hydration mismatches and showing the event's
 * intended local time regardless of where it's rendered.
 */
const TZ = "Africa/Lagos";

export function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  });
}

export function formatEventDateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
}

export function formatEventTimeRange(startIso: string, endIso: string | null): string {
  const s = new Date(startIso);
  if (Number.isNaN(s.getTime())) return "";
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  };
  const start = s.toLocaleTimeString("en-GB", opts);
  if (!endIso) return `${start} (WAT)`;
  const e = new Date(endIso);
  if (Number.isNaN(e.getTime())) return `${start} (WAT)`;
  return `${start} — ${e.toLocaleTimeString("en-GB", opts)} (WAT)`;
}
