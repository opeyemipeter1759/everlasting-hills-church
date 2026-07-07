"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { EventSummary } from "@/types";
import { useRegisteredEvents } from "@/hooks";
import ScrollReveal from "../ScrollReveal";
import EventTicketCard from "./EventTicketCard";
import EventRsvpModal from "./EventRsvpModal";

/**
 * Homepage teaser grid for up to three upcoming events, each styled as a
 * compact admit-one ticket: die-cut notches at the perforation, a small date
 * stamp, and quick actions to register or share (invite link, flier image,
 * WhatsApp). Sized to sit three-across so it never dominates the homepage.
 */
export default function EventSpotlight({ events }: { events: EventSummary[] }) {
  const [rsvpModalEvent, setRsvpModalEvent] = useState<EventSummary | null>(null);
  const registeredEvents = useRegisteredEvents();

  return (
    <section id="event" className="relative overflow-hidden bg-white py-24 md:py-32">
      <div className="pointer-events-none absolute -top-24 left-[-8%] h-96 w-96 rounded-full bg-[#FFE8ED]/70 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-8%] h-96 w-96 rounded-full bg-[#FFF4F6] blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <ScrollReveal>
          <div className="flex flex-col items-start text-start">
            <span className="inline-flex items-start gap-2 text-xs font-bold uppercase tracking-[0.3em] text-[#87102C]">
              <Sparkles size={13} />
              Upcoming Events
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] tracking-tight text-balance leading-[1.1]">
              You&apos;re invited.
            </h2>
            <p className="mt-4 max-w-lg text-[#555] text-base sm:text-lg leading-relaxed">
              Gatherings worth clearing your calendar for grab your seat, and bring someone with you.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => (
            <ScrollReveal key={event.id} delay={0.1 + i * 0.08}>
              <EventTicketCard
                event={event}
                onNeedsRsvpModal={() => setRsvpModalEvent(event)}
                registeredEvents={registeredEvents}
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
