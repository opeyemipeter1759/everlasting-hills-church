import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { serverApi } from "@/lib/api/server";
import type { ApiError } from "@/lib/api/server";
import type { EventDetail } from "@/types";
import EventHero from "@/components/events/detail/EventHero";
import EventDetailsBento from "@/components/events/detail/EventDetailsBento";
import EventRsvpForm from "@/components/events/detail/EventRsvpForm";
import { formatEventDate } from "@/components/events/detail/event-format";

/**
 * Generic public event detail page.
 *
 * Note: the bespoke `events/heaven-on-earth/` static segment takes precedence over
 * this dynamic `[slug]` route in the App Router, so it never renders Heaven on Earth.
 * As a safety net, any event carrying a `customPath` is redirected to it.
 */

async function fetchEvent(slug: string): Promise<EventDetail | null> {
  try {
    return await serverApi.get<EventDetail>(`/events/${slug}`, {
      withAuth: false,
      revalidate: 300,
    });
  } catch (err) {
    if ((err as ApiError).status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const event = await fetchEvent(params.slug);
  if (!event) return { title: "Event — Everlasting Hills Church" };
  return {
    title: `${event.title} — Everlasting Hills Church`,
    description: event.tagline ?? undefined,
    openGraph: {
      title: event.title,
      description: event.tagline ?? undefined,
      images: event.flyerImageUrl ? [event.flyerImageUrl] : [],
      type: "website",
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const event = await fetchEvent(params.slug);
  if (!event) notFound();
  if (event.customPath && event.customPath !== `/events/${params.slug}`) {
    redirect(event.customPath);
  }

  return (
    <main className="bg-white">
      <EventHero event={event} />
      <EventDetailsBento event={event} />
      {event.rsvpEnabled && (
        <EventRsvpForm
          slug={event.slug}
          eventTitle={event.title}
          dateLabel={formatEventDate(event.startAt)}
        />
      )}
    </main>
  );
}
