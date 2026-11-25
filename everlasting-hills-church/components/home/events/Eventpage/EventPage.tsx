import { getEventsAsViewer } from "@/lib/api/events-server";
import type { EventSummary } from "@/types";
import { getEventTiming } from "@/components/events/detail/event-format";
import { getStructuredContent } from "@/lib/cms-page";
import EventsPageClient from "./EventsPageClient";
import type { EventsHeroProps } from "./EventsHero";

async function fetchAllEvents(): Promise<EventSummary[]> {
  try {
    return await getEventsAsViewer<EventSummary[]>("/events");
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
    // The CMS page key is "events"; "eventsIntro" is only its content type.
    getStructuredContent<EventsIntroContent>("events", {
      fallback: HERO_FALLBACK,
      valid: isValidIntro,
    }),
  ]);

  // Status uses the real date and time. A recurring event (daily/weekly
  // sessions) stays ongoing/upcoming for its whole run, and its card shows the
  // current or next session rather than its first day.
  const now = new Date();
  const timed = events.map((e) => {
    const t = getEventTiming(e, now);
    return { event: { ...e, nextStartAt: t.occurrence.start.toISOString() }, status: t.status, at: t.occurrence.start.getTime() };
  });
  const pick = (status: string, dir: 1 | -1) =>
    timed
      .filter((x) => x.status === status)
      .sort((a, b) => dir * (a.at - b.at))
      .map((x) => x.event);

  const ongoing = pick("ongoing", 1);
  const upcoming = pick("upcoming", 1);
  const past = pick("past", -1);

  const heroProps: EventsHeroProps = {
    eyebrow: hero.eyebrow,
    title: hero.title,
    subtitle: hero.subtitle,
    backgroundImage: hero.heroImage,
  };

  return <EventsPageClient ongoing={ongoing} upcoming={upcoming} past={past} hero={heroProps} />;
}
