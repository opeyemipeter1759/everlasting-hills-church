import type { Metadata } from "next";
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

async function fetchEvent(slug: string): Promise<EventDetail | null> {
  try {
    return await serverApi.get<EventDetail>(`/events/${slug}`, {
      withAuth: false,
      revalidate: 300,
      tags: ["events", `event:${slug}`],
    });
  } catch (error) {
    if ((error as ApiError).status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const event = await fetchEvent(params.slug);
  if (!event) return { title: "Event — Everlasting Hills Church" };
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
  const event = await fetchEvent(params.slug);
  if (!event) notFound();
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
