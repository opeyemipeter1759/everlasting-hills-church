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
 * Public event detail page — what every share link points at.
 *
 * The share sheet builds `customPath ?? /events/<slug>` (see
 * components/home/events/useEventShare), so without this route every event
 * shared from a ticket card or the invite modal 404s. It was removed in July
 * alongside a homepage change while the links that depend on it stayed, which
 * is exactly how it went unnoticed.
 *
 * An event carrying a `customPath` is redirected to its bespoke page. The
 * inequality check matters: a customPath equal to this very URL would redirect
 * to itself forever.
 */

async function fetchEvent(slug: string): Promise<EventDetail | null> {
  try {
    // no-store so a draft published after a failed visit isn't stuck on a cached 404.
    return await serverApi.get<EventDetail>(`/events/${slug}`, {
      withAuth: false,
      cache: "no-store",
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
