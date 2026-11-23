"use client";

import { useEffect, useState } from "react";
import type { EventSummary } from "@/types";
import { formatEventDateRange } from "@/components/events/detail/event-format";
import { useEventRegistration, type RegisteredEvents } from "./useEventRegistration";
import { statusLabel } from "./event-card-utils";
import EventFlier from "./EventFlier";
import EventCardHeading from "./EventCardHeading";
import EventCardFooter from "./EventCardFooter";

interface EventTicketCardProps {
  event: EventSummary;
  onNeedsRsvpModal: () => void;
  registeredEvents: RegisteredEvents;
  compact?: boolean;
}

/** Banner on top, date tile + title, description, then time / location / action pinned to the bottom. */
export default function EventTicketCard({ event, onNeedsRsvpModal, registeredEvents, compact = false }: EventTicketCardProps) {
  const href = event.customPath ?? `/events/${event.slug}`;
  const dateLabel = formatEventDateRange(event.startAt, event.endAt);

  // Relative status depends on "now", so it's computed after mount (no hydration mismatch).
  const [status, setStatus] = useState("");

  useEffect(() => {
    setStatus(statusLabel(event, new Date()));
    const id = setInterval(() => setStatus(statusLabel(event, new Date())), 60_000);
    return () => clearInterval(id);
  }, [event]);

  // Explicitly false, not merely falsy: the field only reaches the summary
  // payload once the API carrying it is deployed, and until then treating a
  // missing value as "no RSVPs" would hide Register on every event.
  const takingRsvps = event.registrationRequired !== false && event.rsvpEnabled !== false;

  const { registering, registered, handleRegisterClick } = useEventRegistration(event, onNeedsRsvpModal, registeredEvents);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#E7E2E4] bg-white transition-shadow duration-300 hover:shadow-[0_18px_40px_-18px_rgba(135,16,44,0.25)]">
      <EventFlier event={event} href={href} status={status} compact={compact} />

      <div className={`flex flex-1 flex-col ${compact ? "px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5" : "px-6 pb-5 pt-6 sm:px-8 sm:pt-7"}`}>
        <EventCardHeading event={event} href={href} compact={compact} />

        {event.shortDescription && (
          <p className={compact ? "mt-3 text-sm leading-relaxed text-[#555] line-clamp-2" : "mt-5 text-[17px] leading-relaxed text-[#555] line-clamp-3"}>
            {event.shortDescription}
          </p>
        )}

        {/* Pinned to the bottom so cards in a row line up */}
        <div className={`mt-auto ${compact ? "pt-4" : "pt-6"}`}>
          <EventCardFooter
            event={event}
            href={href}
            takingRsvps={takingRsvps}
            registering={registering}
            registered={registered}
            onRegister={handleRegisterClick}
            compact={compact}
          />
        </div>
      </div>
    </article>
  );
}
