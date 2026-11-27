import { getEventsAsViewer } from "@/lib/api/events-server";
import type { EventSummary } from "@/types";
import { getEventTiming } from "@/components/events/detail/event-format";
import EventSpotlight from "./EventSpotlight";

async function fetchSpotlightEvents(): Promise<EventSummary[]> {
  try {
    const events = await getEventsAsViewer<EventSummary[]>("/events");
    const now = new Date();
    // Recurring events show their next (or current) session, not their first day.
    const upcoming = events
      .map((e) => ({ e: e, t: getEventTiming(e, now) }))
      .filter(({ t }) => t.status !== "past")
      .sort((a, b) => a.t.occurrence.start.getTime() - b.t.occurrence.start.getTime())
      .map(({ e, t }) => ({ ...e, nextStartAt: t.occurrence.start.toISOString() }));
    const featured = upcoming.filter((e) => e.featured);
    const rest = upcoming.filter((e) => !e.featured);
    return [...featured, ...rest].slice(0, 3);
  } catch {
    return [];
  }
}

export default async function EventSection() {
  const events = await fetchSpotlightEvents();
  if (events.length === 0) return null;
  return <EventSpotlight events={events} />;
}
