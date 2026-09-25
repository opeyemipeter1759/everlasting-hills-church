import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { serverApi, type ApiError } from "@/lib/api/server";
import type { EventDetail } from "@/types";
import EventHero from "@/components/events/detail/EventHero";
import EventDetailsBento from "@/components/events/detail/EventDetailsBento";
import EventRsvpForm from "@/components/events/detail/EventRsvpForm";
import EventSectionsRenderer from "@/components/events/detail/EventSectionsRenderer";
import MobileLiveBar from "@/components/events/detail/MobileLiveBar";
import { formatEventDateRange } from "@/components/events/detail/event-format";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://everlastinghills.org";

/**
 * The frontend deploys on push and the API does not, so this page has to cope
 * with an older payload that predates schedules, sections and the timezone
 * field. Filling them in here — once, at the boundary — keeps every component
 * below free of the same defensive checks, and a 500 on a live event page is
 * far worse than an event rendering without its extras for a few hours.
 */
function normalize(event: EventDetail): EventDetail {
  return {
    ...event,
    Sections: event.Sections ?? [],
    Schedules: event.Schedules ?? [],
    timezone: event.timezone ?? "Africa/Lagos",
  };
}

/** Shown when the API cannot be reached — a branded, honest holding page
 * rather than a crash screen on a link somebody has just shared. */
function EventUnavailable() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-white px-5 py-24 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#87102C]">
        Everlasting Hills Church
      </p>
      <h1 className="mt-4 max-w-xl text-balance text-3xl font-black tracking-tight text-[#111] sm:text-4xl">
        This event is taking a moment to load
      </h1>
      <p className="mt-4 max-w-md text-base leading-7 text-[#555]">
        We could not reach the event just now. Please refresh in a moment — the details are still
        there.
      </p>
      <Link
        href="/events"
        className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#87102C] px-7 text-sm font-black uppercase tracking-[0.06em] text-white transition hover:bg-[#6E0C24]"
      >
        See all events
      </Link>
    </main>
  );
}

type FetchResult =
  | { state: "ok"; event: EventDetail }
  | { state: "missing" }
  | { state: "unavailable" };

async function fetchEvent(slug: string): Promise<FetchResult> {
  try {
    const event = await serverApi.get<EventDetail>(`/events/${slug}`, {
      withAuth: false,
      revalidate: 300,
      tags: ["events", `event:${slug}`],
    });
    return event ? { state: "ok", event: normalize(event) } : { state: "missing" };
  } catch (error) {
    const status = (error as ApiError).status;
    if (status === 404) return { state: "missing" };
    // The API being down is not the visitor's problem to decode. A shared
    // event link landing on a crash screen looks like the church's page is
    // broken for good; this says it plainly and invites them back. The failure
    // is still logged and reported server-side by the API itself.
    if (status !== undefined && status >= 500) return { state: "unavailable" };
    throw error;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const result = await fetchEvent(params.slug);
  if (result.state !== "ok") return { title: "Event — Everlasting Hills Church" };
  const event = result.event;
  const title = event.seoTitle || `${event.title}${event.theme ? ` — ${event.theme}` : ""} | Everlasting Hills Church`;
  const description = event.seoDescription || event.shortDescription || event.tagline || event.description || undefined;
  const image = event.socialImageUrl || event.heroImageUrl || event.coverImageUrl || event.flyerImageUrl;
  const canonical = `${SITE_URL}/events/${event.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: "Everlasting Hills Church", images: image ? [image] : [], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : [] },
  };
}

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const result = await fetchEvent(params.slug);
  if (result.state === "missing") notFound();
  if (result.state === "unavailable") return <EventUnavailable />;
  const event = result.event;
  if (event.customPath && event.customPath !== `/events/${params.slug}`) redirect(event.customPath);

  const canonical = `${SITE_URL}/events/${event.slug}`;
  const image = event.socialImageUrl || event.heroImageUrl || event.coverImageUrl || event.flyerImageUrl;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${event.title}${event.theme ? ` — ${event.theme}` : ""}`,
    description: event.seoDescription || event.shortDescription || event.description || event.tagline || undefined,
    startDate: event.startAt,
    endDate: event.endAt || undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: event.locationType === "ONLINE" ? "https://schema.org/OnlineEventAttendanceMode" : event.locationType === "HYBRID" ? "https://schema.org/MixedEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    url: canonical,
    image: image ? [image] : undefined,
    organizer: { "@type": "Organization", name: "Everlasting Hills Church", url: SITE_URL },
    location: event.locationType === "ONLINE"
      ? (event.liveUrl ? { "@type": "VirtualLocation", url: event.liveUrl } : undefined)
      : { "@type": "Place", name: event.venueName || "Everlasting Hills Church", address: event.venueAddress || undefined },
  };

  return (
    <main className={`bg-white ${event.liveUrl ? "pb-20 md:pb-0" : ""}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <EventHero event={event} />
      <EventDetailsBento event={event} />
      <EventSectionsRenderer event={event} />
      {event.registrationRequired !== false && event.rsvpEnabled && (
        <EventRsvpForm slug={event.slug} eventTitle={event.title} dateLabel={formatEventDateRange(event.startAt, event.endAt, event.timezone)} />
      )}
      {event.liveUrl && <MobileLiveBar href={event.liveUrl} label={event.primaryCtaLabel || "Join Live"} />}
    </main>
  );
}
