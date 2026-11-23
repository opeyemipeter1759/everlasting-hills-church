"use client";

import { useEffect, useState } from "react";
import { Check, Share2, UserPlus } from "lucide-react";
import type { EventSummary } from "@/types";
import { formatEventDateRange } from "@/components/events/detail/event-format";
import { useEventShare } from "./useEventShare";
import { useEventRegistration, type RegisteredEvents } from "./useEventRegistration";
import { statusLabel } from "./event-card-utils";
import EventFlier from "./EventFlier";
import EventCardHeading from "./EventCardHeading";
import EventCardFooter from "./EventCardFooter";
import ShareButton from "./ShareButton";
import WhatsAppIcon from "./WhatsAppIcon";
import EventInviteModal from "./EventInviteModal";

interface EventTicketCardProps {
  event: EventSummary;
  onNeedsRsvpModal: () => void;
  registeredEvents: RegisteredEvents;
}

/** Banner on top, date tile + title, description, then time / location / action pinned to the bottom. */
export default function EventTicketCard({ event, onNeedsRsvpModal, registeredEvents }: EventTicketCardProps) {
  const href = event.customPath ?? `/events/${event.slug}`;
  const dateLabel = formatEventDateRange(event.startAt, event.endAt);

  // Relative status depends on "now", so it's computed after mount (no hydration mismatch).
  const [status, setStatus] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    setStatus(statusLabel(event, new Date()));
    const id = setInterval(() => setStatus(statusLabel(event, new Date())), 60_000);
    return () => clearInterval(id);
  }, [event]);

  // Explicitly false, not merely falsy: the field only reaches the summary
  // payload once the API carrying it is deployed, and until then treating a
  // missing value as "no RSVPs" would hide Register on every event.
  const takingRsvps = event.registrationRequired !== false && event.rsvpEnabled !== false;

  const { copied, handleShareLink, handleWhatsApp } = useEventShare(event, href, dateLabel);
  const { registering, registered, handleRegisterClick } = useEventRegistration(event, onNeedsRsvpModal, registeredEvents);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#E7E2E4] bg-white transition-shadow duration-300 hover:shadow-[0_18px_40px_-18px_rgba(135,16,44,0.25)]">
      <EventFlier
        event={event}
        href={href}
        status={status}
        actions={
          <>
            {registered && (
              <ShareButton onClick={() => setInviteOpen(true)} title="Invite a friend">
                <UserPlus size={15} />
              </ShareButton>
            )}
            <ShareButton onClick={handleShareLink} title={copied ? "Link copied" : "Copy invite link"}>
              {copied ? <Check size={15} /> : <Share2 size={15} />}
            </ShareButton>
            <ShareButton onClick={handleWhatsApp} title="Share on WhatsApp">
              <WhatsAppIcon />
            </ShareButton>
          </>
        }
      />
      <span className="sr-only" aria-live="polite">
        {copied ? "Invite link copied" : ""}
      </span>

      <div className="flex flex-1 flex-col px-6 pb-5 pt-6 sm:px-8 sm:pt-7">
        <EventCardHeading event={event} href={href} />

        {event.shortDescription && (
          <p className="mt-5 text-[17px] leading-relaxed text-[#555] line-clamp-3">{event.shortDescription}</p>
        )}

        {/* Pinned to the bottom so cards in a row line up */}
        <div className="mt-auto pt-6">
          <EventCardFooter
            event={event}
            href={href}
            takingRsvps={takingRsvps}
            registering={registering}
            registered={registered}
            onRegister={handleRegisterClick}
          />
        </div>
      </div>

      {inviteOpen && <EventInviteModal event={event} onClose={() => setInviteOpen(false)} />}
    </article>
  );
}
