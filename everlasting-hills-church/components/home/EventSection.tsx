import { serverApi } from "@/lib/api/server";
import type { EventSummary } from "@/types";
import { isPastEventDate } from "@/components/events/detail/event-format";
import EventSpotlight from "./EventSpotlight";

async function fetchSpotlightEvents(): Promise<EventSummary[]> {
  try {
    const events = await serverApi.get<EventSummary[]>("/events", {
      withAuth: false,
      revalidate: 300,
    });
    const upcoming = events
      .filter((e) => !isPastEventDate(e.startAt, e.endAt))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
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
