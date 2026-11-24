"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { EventSummary } from "@/types";
import { useRegisteredEvents } from "@/hooks";
import ScrollReveal from "../ScrollReveal";
import EventTicketCard from "./EventTicketCard";
import EventRsvpModal from "./EventRsvpModal";

/**
 * Homepage teaser for up to three upcoming events, sized so the whole section fits
 * on one screen. Banner image on top, date tile + title, description, then a footer
 * with time/location and the action. Three events sit three-across; one or two fill
 * the width two-across. Cards in a row share one height with aligned footers.
 */
export default function EventSpotlight({ events }: { events: EventSummary[] }) {
  const [rsvpModalEvent, setRsvpModalEvent] = useState<EventSummary | null>(null);
  const registeredEvents = useRegisteredEvents();

  return (
    <section id="event" className="relative overflow-hidden bg-white py-16 md:py-20">
      <div className="pointer-events-none absolute -top-24 left-[-8%] h-96 w-96 rounded-full bg-[#FFE8ED]/60 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-4 xs:px-5 sm:px-8">
        <ScrollReveal>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#87102C] xs:tracking-[0.25em]">
                <Sparkles size={13} />
                Upcoming Events
              </span>
              <h2 className="mt-3 text-3xl font-bold leading-[1.1] tracking-tight text-[#111] text-balance md:text-4xl">
                You&apos;re invited.
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[#555]">
                Gatherings worth clearing your calendar for. Grab your seat, and bring someone with you.
              </p>
            </div>
            <Link
              href="/events"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-[#87102C] transition-colors hover:text-[#6E0C24]"
            >
              View all events
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Three events → three across. Fewer → two columns that fill the full width. */}
        <div
          className={`mt-10 grid grid-cols-1 gap-6 lg:gap-8 ${
            events.length >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"
          }`}
        >
          {events.map((event, i) => (
            <ScrollReveal key={event.id} delay={0.1 + i * 0.08} className="h-full">
              <EventTicketCard
                event={event}
                onNeedsRsvpModal={() => setRsvpModalEvent(event)}
                registeredEvents={registeredEvents}
                compact
              />
            </ScrollReveal>
          ))}
        </div>
      </div>

      {rsvpModalEvent && (
        <EventRsvpModal
          event={rsvpModalEvent}
          onClose={() => setRsvpModalEvent(null)}
          registeredEvents={registeredEvents}
        />
      )}
    </section>
  );
}
