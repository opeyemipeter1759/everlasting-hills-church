"use client";

import { useEventRsvps } from "./event-rsvps/useEventRsvps";
import EventRsvpsHero from "./event-rsvps/EventRsvpsHero";
import EventRsvpsStats from "./event-rsvps/EventRsvpsStats";
import RsvpListSection from "./event-rsvps/RsvpListSection";

export default function EventRsvpsClient({ id }: { id: string }) {
  const { event, eventLoading, eventError, rsvps, rsvpsLoading, checkIn } = useEventRsvps(id);

  if (eventLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="h-48 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="max-w-4xl">
        <p className="text-sm text-red-600 dark:text-red-400">
          {(eventError as { message?: string } | null)?.message ?? "Event not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-5">
      <EventRsvpsHero event={event} />
      <EventRsvpsStats rsvps={rsvps ?? []} />
      {rsvpsLoading ? (
        <div className="h-40 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
      ) : (
        <RsvpListSection event={event} rsvps={rsvps ?? []} checkIn={checkIn} />
      )}
    </div>
  );
}
