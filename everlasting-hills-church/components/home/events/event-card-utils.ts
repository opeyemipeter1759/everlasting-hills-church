import type { EventSummary } from "@/types";
import { formatEventTime, getEventTiming } from "@/components/events/detail/event-format";
import { TZ } from "./constants";

export const LOCATION_LABEL: Record<EventSummary["locationType"], string> = {
  PHYSICAL: "In person",
  ONLINE: "Online",
  HYBRID: "In person & online",
};

/** The church's YouTube live page: it opens whatever is streaming now. */
export const CHURCH_LIVE_URL = "https://www.youtube.com/@everlastinghillschurch/live";

/** Where "Watch live" goes: the event's own stream, or the church's live page when it has none. */
export const watchLiveUrl = (event: Pick<EventSummary, "liveUrl">) => event.liveUrl?.trim() || CHURCH_LIVE_URL;

export const focusRing =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40 focus-visible:ring-offset-2";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Calendar date in Lagos time as a sortable "YYYY-MM-DD" key. */
function dayKey(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((Date.parse(dayKey(b)) - Date.parse(dayKey(a))) / DAY_MS);
}

/** "Happening now" / "Today · 5:00 PM WAT" / "Tomorrow · …" / "In 4 days" / "Upcoming" / "Ended". */
export function statusLabel(event: EventSummary, now: Date) {
  // Same rules as the events page tabs: real date + time, recurring sessions included.
  const { status, occurrence } = getEventTiming(event, now);
  if (status === "ongoing") return "Happening now";
  if (status === "past") return "Ended";
  const iso = occurrence.start.toISOString();
  const time = `${formatEventTime(iso)} WAT`;
  const days = daysBetween(now, occurrence.start);
  if (days <= 0) return `Today · ${time}`;
  if (days === 1) return `Tomorrow · ${time}`;
  if (days <= 6) return `In ${days} days`;
  return "Upcoming";
}

function formatScheduleTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

/** Small chips under the title: multi-day span, daily schedule, featured. */
export function eventChips(event: EventSummary): string[] {
  const spanDays = event.endAt ? daysBetween(new Date(event.startAt), new Date(event.endAt)) + 1 : 1;
  const chips: string[] = [];
  if (spanDays > 1) chips.push(`${spanDays} days · Day 1 to ${spanDays}`);
  if (event.Schedules?.length > 0) {
    chips.push(`Daily · ${event.Schedules.map((s) => formatScheduleTime(s.startTime)).join(" & ")}`);
  }
  if (event.featured) chips.push("Featured");
  return chips;
}
