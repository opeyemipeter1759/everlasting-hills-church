import { isThisMonth, isThisWeek, isToday, isYesterday, format } from "date-fns";

/** "Today" > "Yesterday" > "This week" > "This month" > "<Month year>" for
 * anything older. Buckets are checked in that order since each is a subset of
 * the next (e.g. today is also "this week"), so order matters. */
function bucketLabel(d: Date): string {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  if (isThisWeek(d, { weekStartsOn: 1 })) return "This week";
  if (isThisMonth(d)) return "This month";
  return format(d, "MMMM yyyy");
}

/** Groups rows into date buckets, newest first. Sorts by `dateOf` before
 * grouping, so a bucket's items are always contiguous. */
export function groupByDay<T>(rows: T[], dateOf: (row: T) => string): { label: string; items: T[] }[] {
  const sorted = [...rows].sort((a, b) => new Date(dateOf(b)).getTime() - new Date(dateOf(a)).getTime());
  const groups: { label: string; items: T[] }[] = [];
  for (const row of sorted) {
    const label = bucketLabel(new Date(dateOf(row)));
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(row);
    else groups.push({ label, items: [row] });
  }
  return groups;
}

/** Formats a 24-hour "HH:mm" time string (what a native `<input type="time">`
 * stores) into a lean 12-hour form — "9am", "1:30pm" — omitting minutes only
 * when they're exactly on the hour. Returns the input unchanged if it isn't
 * in that shape, so a bad/legacy value never renders blank. */
export function formatHHMM12h(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return time;
  const period = hour < 12 ? "am" : "pm";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0 ? `${hour12}${period}` : `${hour12}:${String(minute).padStart(2, "0")}${period}`;
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
