import { serverApi } from "@/lib/api/server";
import type { EventSummary } from "@/types";
import { getEventStatus } from "@/components/events/detail/event-format";
import { getStructuredContent } from "@/lib/cms-page";
import EventsPageClient from "./EventsPageClient";
import type { EventsHeroProps } from "./EventsHero";

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

interface EventsIntroContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  heroImage: string | null;
}

const HERO_FALLBACK: EventsIntroContent = {
  eyebrow: "Everlasting Hills Church",
  title: "Gatherings & Events",
  subtitle:
    "Every service, revival, and reunion worth showing up for — browse what's coming next, or look back on where we've been.",
  heroImage: null,
};

function isValidIntro(c: unknown): c is EventsIntroContent {
  const v = c as EventsIntroContent;
  return Boolean(v && typeof v.title === "string" && typeof v.subtitle === "string");
}

export default async function EventPage() {
  const [events, hero] = await Promise.all([
    fetchAllEvents(),
    getStructuredContent<EventsIntroContent>("eventsIntro", {
      fallback: HERO_FALLBACK,
      valid: isValidIntro,
    }),
  ]);

  const ongoing = events
    .filter((e) => getEventStatus(e.startAt, e.endAt) === "ongoing")
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const upcoming = events
    .filter((e) => getEventStatus(e.startAt, e.endAt) === "upcoming")
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const past = events
    .filter((e) => getEventStatus(e.startAt, e.endAt) === "past")
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

  const heroProps: EventsHeroProps = {
    eyebrow: hero.eyebrow,
    title: hero.title,
    subtitle: hero.subtitle,
    backgroundImage: hero.heroImage,
  };

  return <EventsPageClient ongoing={ongoing} upcoming={upcoming} past={past} hero={heroProps} />;
}
