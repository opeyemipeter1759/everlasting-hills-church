"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CalendarCheck, MapPin, Share2, Check } from "lucide-react";
import type { EventSummary } from "@/types";
import {
  formatEventDateRange,
  formatEventDateShort,
  formatEventTime,
} from "@/components/events/detail/event-format";
import { DEFAULT_DURATION_MS, TZ, timeUntilLabel } from "./constants";
import { useEventShare } from "./useEventShare";
import { useEventRegistration, type RegisteredEvents } from "./useEventRegistration";
import InfoBadge from "./InfoBadge";
import IconButton from "./IconButton";
import EventFlier from "./EventFlier";
import RegisterButton from "./RegisterButton";
import WhatsAppIcon from "./WhatsAppIcon";

interface EventTicketCardProps {
  event: EventSummary;
  onNeedsRsvpModal: () => void;
  registeredEvents: RegisteredEvents;
}

export default function EventTicketCard({
  event,
  onNeedsRsvpModal,
  registeredEvents,
}: EventTicketCardProps) {
  const href = event.customPath ?? `/events/${event.slug}`;
  const dateLabel = formatEventDateRange(event.startAt, event.endAt);
  const startDateLabel = formatEventDateShort(event.startAt);
  const startTimeLabel = formatEventTime(event.startAt);
  const isEstimatedEnd = !event.endAt;
  const effectiveEndIso =
    event.endAt ?? new Date(new Date(event.startAt).getTime() + DEFAULT_DURATION_MS).toISOString();
  const endDateLabel = formatEventDateShort(effectiveEndIso);
  const endTimeLabel = formatEventTime(effectiveEndIso);

  const start = new Date(event.startAt);
  const dayNum = start.toLocaleDateString("en-GB", { day: "2-digit", timeZone: TZ });
  const monthShort = start.toLocaleDateString("en-GB", { month: "short", timeZone: TZ });

  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    setCountdown(timeUntilLabel(event.startAt));
    const id = setInterval(() => setCountdown(timeUntilLabel(event.startAt)), 60_000);
    return () => clearInterval(id);
  }, [event.startAt]);

  const { copied, handleShareLink, handleWhatsApp } = useEventShare(event, href, dateLabel);
  const { registering, registered, handleRegisterClick } = useEventRegistration(
    event,
    onNeedsRsvpModal,
    registeredEvents
  );

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-20px_rgba(135,16,44,0.25)] ring-1 ring-[#F0DCE1]">
      <EventFlier event={event} dayNum={dayNum} monthShort={monthShort} countdown={countdown} />

      {/* ── Perforation ── */}
      <div className="relative border-t-2 border-dashed border-[#E7CDD3]">
        <span className="absolute -left-3.5 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white" />
        <span className="absolute -right-3.5 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white" />
      </div>

      {/* ── Manifest / details ── */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold leading-snug tracking-tight text-[#111] line-clamp-2">
          {event.title}
        </h3>

        <div className="mt-3 space-y-2">
          {startDateLabel && (
            <InfoBadge icon={CalendarDays} label="Starts">
              {startDateLabel}
              {startTimeLabel && <span className="text-[#87102C]"> · {startTimeLabel}</span>}
            </InfoBadge>
          )}
          {endDateLabel && (
            <InfoBadge icon={CalendarCheck} label={isEstimatedEnd ? "Ends (est.)" : "Ends"}>
              {endDateLabel}
              {endTimeLabel && <span className="text-[#87102C]"> · {endTimeLabel}</span>}
            </InfoBadge>
          )}
          {event.venueName && (
            <InfoBadge icon={MapPin} label="Location">
              {event.venueName}
            </InfoBadge>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <RegisterButton
            onClick={handleRegisterClick}
            registering={registering}
            registered={registered}
          />
          <IconButton onClick={handleShareLink} title="Share invite link">
            {copied ? <Check size={14} /> : <Share2 size={14} />}
          </IconButton>
          <IconButton onClick={handleWhatsApp} title="Share on WhatsApp" className="text-[#25D366]">
            <WhatsAppIcon />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
