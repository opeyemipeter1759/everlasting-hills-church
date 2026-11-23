import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { EventSummary } from "@/types";
import { formatEventTime } from "@/components/events/detail/event-format";
import { focusRing, LOCATION_LABEL } from "./event-card-utils";

const actionClass = `inline-flex flex-shrink-0 items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.14em] text-[#87102C] transition-colors hover:text-[#6E0C24] ${focusRing}`;

interface Props {
  event: EventSummary;
  href: string;
  takingRsvps: boolean;
  registering: boolean;
  registered: boolean;
  onRegister: () => void;
}

/**
 * Time · location on the left, the action on the right — on one line, always:
 * the time keeps its width and the location truncates. Start time only, so it fits
 * three-across; multi-day events already say so in a chip under the title.
 */
export default function EventCardFooter({ event, href, takingRsvps, registering, registered, onRegister }: Props) {
  const location = event.venueName || LOCATION_LABEL[event.locationType];

  return (
    <div className="flex flex-nowrap items-center gap-4 border-t border-[#ECE7E9] pt-5">
      <dl className="flex min-w-0 flex-1 flex-nowrap items-center text-[13px] font-medium uppercase tracking-[0.14em] text-[#6B6B6B]">
        <dt className="sr-only">Time</dt>
        <dd className="flex-shrink-0 whitespace-nowrap">{formatEventTime(event.startAt)} WAT</dd>
        {location && (
          <>
            <span aria-hidden="true" className="mx-2 flex-shrink-0 text-[#C9C2C5]">·</span>
            <dt className="sr-only">Location</dt>
            <dd className="min-w-0 truncate" title={location}>
              {location}
            </dd>
          </>
        )}
      </dl>

      <div className="flex flex-shrink-0 items-center">
        {/* An event created without RSVPs has nothing to register for, so
            the card offers its page instead of a dead Register action. */}
        {event.liveUrl ? (
          <a href={event.liveUrl} target="_blank" rel="noopener noreferrer" className={actionClass}>
            {event.primaryCtaLabel || "Join live"}
            <ArrowRight size={15} aria-hidden="true" />
          </a>
        ) : takingRsvps ? (
          <button
            type="button"
            onClick={onRegister}
            disabled={registering || registered}
            className={`${actionClass} disabled:cursor-default ${registered ? "text-emerald-700 hover:text-emerald-700" : ""}`}
          >
            {registering ? "Registering…" : registered ? "Registered" : "Register"}
            {registered ? <Check size={15} aria-hidden="true" /> : <ArrowRight size={15} aria-hidden="true" />}
          </button>
        ) : (
          <Link href={href} className={actionClass}>
            See details
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
