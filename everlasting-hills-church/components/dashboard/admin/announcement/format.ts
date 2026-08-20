// Pinned so the server render (Node's locale/timezone) and the client render
// (the browser's) always produce identical text — a mismatch here is a
// hydration error, since these run directly in JSX on first paint.
const LOCALE = "en-NG";
const TIME_ZONE = "Africa/Lagos";

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIME_ZONE,
  });
}

export function formatRelativeDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.toLocaleDateString(LOCALE, { timeZone: TIME_ZONE }) ===
    now.toLocaleDateString(LOCALE, { timeZone: TIME_ZONE });
  if (isToday) {
    return date.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE });
  }
  return date.toLocaleDateString(LOCALE, { month: "short", day: "numeric", timeZone: TIME_ZONE });
}
