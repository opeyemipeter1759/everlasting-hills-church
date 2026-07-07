"use client";

import { useState } from "react";
import type { EventSummary } from "@/types";
import { useRegisteredEvents } from "@/hooks";
import EventTicketCard from "../EventTicketCard";
import EventRsvpModal from "../EventRsvpModal";
import EventsHero from "./EventsHero";
import EventsTabBar, { type EventsTab } from "./EventsTabBar";
import EventsEmptyState from "./EventsEmptyState";

interface EventsPageClientProps {
  ongoing: EventSummary[];
  upcoming: EventSummary[];
  past: EventSummary[];
}

export default function EventsPageClient({ ongoing, upcoming, past }: EventsPageClientProps) {
  const [tab, setTab] = useState<EventsTab>(ongoing.length > 0 ? "ongoing" : "upcoming");
  const [rsvpModalEvent, setRsvpModalEvent] = useState<EventSummary | null>(null);
  const registeredEvents = useRegisteredEvents();

  const eventsByTab: Record<EventsTab, EventSummary[]> = { ongoing, upcoming, past };
  const events = eventsByTab[tab];

  return (
    <main className="min-h-screen bg-white">
      <EventsHero />

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
        <div className="mb-10 flex justify-center sm:justify-start">
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventTicketCard
                key={event.id}
                event={event}
                onNeedsRsvpModal={() => setRsvpModalEvent(event)}
                registeredEvents={registeredEvents}
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
