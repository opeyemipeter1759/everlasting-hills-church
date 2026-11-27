"use client";

import { useState } from "react";
import type { EventSummary } from "@/types";
import { useRegisteredEvents } from "@/hooks";
import EventTicketCard from "../EventTicketCard";
import EventRsvpModal from "../EventRsvpModal";
import EventsHero, { type EventsHeroProps } from "./EventsHero";
import EventsTabBar, { type EventsTab } from "./EventsTabBar";
import EventsEmptyState from "./EventsEmptyState";

interface EventsPageClientProps {
  ongoing: EventSummary[];
  upcoming: EventSummary[];
  past: EventSummary[];
  hero?: EventsHeroProps;
}

export default function EventsPageClient({ ongoing, upcoming, past, hero }: EventsPageClientProps) {
  const [tab, setTab] = useState<EventsTab>(ongoing.length > 0 ? "ongoing" : "upcoming");
  const [rsvpModalEvent, setRsvpModalEvent] = useState<EventSummary | null>(null);
  const registeredEvents = useRegisteredEvents();

  const eventsByTab: Record<EventsTab, EventSummary[]> = { ongoing, upcoming, past };
  const events = eventsByTab[tab];

  return (
    <main className="min-h-screen bg-white">
      <EventsHero {...hero} />

      <div className="mx-auto max-w-6xl px-4 xs:px-5 py-10 xs:py-14 sm:px-8 md:py-20">
        <div className="mb-10 flex justify-start">
          <EventsTabBar
            active={tab}
            onChange={setTab}
            ongoingCount={ongoing.length}
            upcomingCount={upcoming.length}
            pastCount={past.length}
          />
        </div>

        {events.length === 0 ? (
          <EventsEmptyState tab={tab} />
        ) : (
          // Same grid as the homepage spotlight: one column until md, roomier gaps,
          // and a third column only once there are three or more events.
          <div
            className={`grid grid-cols-1 gap-6 lg:gap-8 ${
              events.length >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"
            }`}
          >
            {events.map((event) => (
              <EventTicketCard
                key={event.id}
                event={event}
                onNeedsRsvpModal={() => setRsvpModalEvent(event)}
                registeredEvents={registeredEvents}
                // Same card as the homepage: identical type sizes, weights, banner and padding.
                compact
              />
            ))}
          </div>
        )}
      </div>

      {rsvpModalEvent && (
        <EventRsvpModal
          event={rsvpModalEvent}
          onClose={() => setRsvpModalEvent(null)}
          registeredEvents={registeredEvents}
        />
      )}
    </main>
  );
}
