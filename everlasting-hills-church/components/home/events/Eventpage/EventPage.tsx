import { serverApi } from "@/lib/api/server";
import type { EventSummary } from "@/types";
import { getEventStatus } from "@/components/events/detail/event-format";
import EventsPageClient from "./EventsPageClient";

async function fetchAllEvents(): Promise<EventSummary[]> {
  try {
    return await serverApi.get<EventSummary[]>("/events", {
      withAuth: false,
      revalidate: 300,
    });
  } catch {
    return [];
  }
}

export default async function EventPage() {
  const events = await fetchAllEvents();

  const ongoing = events
    .filter((e) => getEventStatus(e.startAt, e.endAt) === "ongoing")
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const upcoming = events
    .filter((e) => getEventStatus(e.startAt, e.endAt) === "upcoming")
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const past = events
    .filter((e) => getEventStatus(e.startAt, e.endAt) === "past")
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

  return <EventsPageClient ongoing={ongoing} upcoming={upcoming} past={past} />;
}
