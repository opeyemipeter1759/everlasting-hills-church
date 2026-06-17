import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Sparkles } from "lucide-react";
import { serverApi } from "@/lib/api/server";
import type { EventSummary } from "@/types";
import { formatEventDateShort } from "@/components/events/detail/event-format";

export const metadata: Metadata = {
  title: "Events — Everlasting Hills Church",
  description: "Upcoming gatherings, conferences, and special services at Everlasting Hills Church.",
};

async function fetchEvents(): Promise<EventSummary[]> {
  try {
    // no-store so a freshly published/edited event shows immediately (no ISR lag).
    return await serverApi.get<EventSummary[]>("/events", {
      withAuth: false,
      cache: "no-store",
    });
  } catch {
    return [];
  }
}

export default async function EventsIndexPage() {
  const events = await fetchEvents();

  return (
    <main className="bg-white">
      {/* Header */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 px-5 sm:px-8 bg-gradient-to-b from-[#FFF4F6] to-white">
        <div className="max-w-6xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#87102C] mb-3">
            <Sparkles size={14} />
            Gather with us
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#111] leading-[1.05] tracking-tight text-balance">
            Events
          </h1>
          <p className="mt-4 text-[#555] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Conferences, special services, and gatherings designed to strengthen
            faith and build family. We&apos;d love to see you there.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-24 md:pb-32 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          {events.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function EventCard({ event }: { event: EventSummary }) {
  const href = event.customPath ?? `/events/${event.slug}`;
  const dateLabel = formatEventDateShort(event.startAt);

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-[#E7CDD3]/60 transition-all duration-300 hover:-translate-y-1 hover:border-[#E7CDD3] hover:shadow-[0_8px_40px_rgba(135,16,44,0.12)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1a0610]">
        {event.flyerImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={event.flyerImageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(160deg, #2a0410 0%, #4a0819 30%, #87102C 70%, #a01535 100%)",
            }}
          >
            <CalendarDays size={40} className="text-[#FFB3C1]/60" />
          </div>
        )}
        {event.featured && (
          <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-[#87102C] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        {dateLabel && (
          <p className="inline-flex items-center gap-1.5 text-[#87102C] text-xs font-semibold tracking-wide mb-2">
            <CalendarDays size={13} />
            {dateLabel}
          </p>
        )}
        <h2 className="text-lg font-bold text-[#111] leading-snug tracking-tight line-clamp-2">
          {event.title}
        </h2>
        {event.tagline && (
          <p className="mt-2 text-sm text-[#555] leading-relaxed line-clamp-2">
            {event.tagline}
          </p>
        )}
        {event.venueName && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#888]">
            <MapPin size={12} />
            {event.venueName}
          </p>
        )}
        <p className="mt-4 inline-flex items-center gap-1.5 text-[#87102C] text-sm font-semibold group-hover:gap-2.5 transition-all">
          View event
          <ArrowRight size={13} />
        </p>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="bg-[#FFF4F6]/60 border border-[#E7CDD3]/60 rounded-2xl px-8 py-16 text-center max-w-2xl mx-auto">
      <CalendarDays size={28} className="mx-auto text-[#87102C]/40 mb-4" />
      <p className="text-base sm:text-lg font-semibold text-[#111] mb-2">
        No upcoming events right now
      </p>
      <p className="text-sm text-[#555] max-w-md mx-auto">
        Check back soon — new gatherings are added here as they&apos;re scheduled.
      </p>
    </div>
  );
}
