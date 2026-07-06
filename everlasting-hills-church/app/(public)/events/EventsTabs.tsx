"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { EventSummary } from "@/types";
import { formatEventDateShort } from "@/components/events/detail/event-format";

type Tab = "upcoming" | "past";

export default function EventsTabs({
  upcoming,
  past,
}: {
  upcoming: EventSummary[];
  past: EventSummary[];
}) {
  const [tab, setTab] = useState<Tab>(upcoming.length > 0 ? "upcoming" : "past");

  const isEmpty = upcoming.length === 0 && past.length === 0;

  return (
    <section className="pb-24 md:pb-32 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">
        {isEmpty ? (
          <EmptyState message="No events yet. Check back soon." />
        ) : (
          <>
            {/* Tabs */}
            <div className="flex justify-center mb-10">
            <div className="flex items-center gap-1 bg-[#FFF4F6] rounded-xl p-1 w-fit">
              <TabButton
                active={tab === "upcoming"}
                onClick={() => setTab("upcoming")}
                count={upcoming.length}
              >
                Upcoming
              </TabButton>
              <TabButton
                active={tab === "past"}
                onClick={() => setTab("past")}
                count={past.length}
              >
                Past Events
              </TabButton>
            </div>
            </div>

            {/* Upcoming grid */}
            {tab === "upcoming" && (
              upcoming.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcoming.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <EmptyState message="No upcoming events right now. Check the Past Events tab for previous gatherings." />
              )
            )}

            {/* Past grid */}
            {tab === "past" && (
              past.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-90">
                  {past.map((event) => (
                    <EventCard key={event.id} event={event} past />
                  ))}
                </div>
              ) : (
                <EmptyState message="No past events to show." />
              )
            )}
          </>
        )}
      </div>
    </section>
  );
}

function TabButton({
  children,
  active,
  onClick,
  count,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-[#87102C] text-white shadow-sm"
          : "text-[#555] hover:text-[#87102C]"
      }`}
    >
      {children}
      {count > 0 && (
        <span
          className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[11px] font-bold px-1.5 ${
            active ? "bg-white/20 text-white" : "bg-[#E7CDD3] text-[#87102C]"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function EventCard({ event, past = false }: { event: EventSummary; past?: boolean }) {
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
            className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${past ? "grayscale-[30%]" : ""}`}
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center"
            style={{
              background: "linear-gradient(160deg, #2a0410 0%, #4a0819 30%, #87102C 70%, #a01535 100%)",
            }}
          >
            <CalendarDays size={40} className="text-[#FFB3C1]/60" />
          </div>
        )}
        {past ? (
          <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
            Past
          </span>
        ) : event.featured ? (
          <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-[#87102C] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
            Featured
          </span>
        ) : null}
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-[#FFF4F6]/60 border border-[#E7CDD3]/60 rounded-2xl px-8 py-16 text-center max-w-2xl mx-auto">
      <CalendarDays size={28} className="mx-auto text-[#87102C]/40 mb-4" />
      <p className="text-sm text-[#555] max-w-md mx-auto">{message}</p>
    </div>
  );
}
