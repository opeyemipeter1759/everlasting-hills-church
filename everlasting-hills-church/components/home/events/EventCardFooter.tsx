import Link from "next/link";
import { ArrowRight, Check, Icon } from "@/components/icons";
import type { EventSummary } from "@/types";
import { formatEventTime } from "@/components/events/detail/event-format";
import { focusRing, LOCATION_LABEL } from "./event-card-utils";

const actionClass = (compact: boolean) =>
  `inline-flex flex-shrink-0 items-center gap-1.5 font-bold uppercase text-[#87102C] transition-colors hover:text-[#6E0C24] ${compact ? "text-[11px] tracking-[0.08em]" : "text-[13px] tracking-[0.14em]"} ${focusRing}`;

interface Props {
  event: EventSummary;
  href: string;
  takingRsvps: boolean;
  registering: boolean;
  registered: boolean;
  onRegister: () => void;
  compact?: boolean;
}

/**
 * Time · location on the left, the action on the right — on one line, always:
 * the time keeps its width and the location truncates. Start time only, so it fits
 * three-across; multi-day events already say so in a chip under the title.
 */
export default function EventCardFooter({ event, href, takingRsvps, registering, registered, onRegister, compact = false }: Props) {
  const location = event.venueName || LOCATION_LABEL[event.locationType];
  const actionClasses = actionClass(compact);
  const arrowSize = compact ? 13 : 15;

  return (
    <div className={`flex flex-nowrap items-center border-t border-[#ECE7E9] ${compact ? "gap-2 pt-4" : "gap-4 pt-5"}`}>
      <dl className={`flex min-w-0 flex-1 flex-nowrap items-center font-medium uppercase text-[#6B6B6B] ${compact ? "text-[10px] tracking-[0.08em]" : "text-[13px] tracking-[0.14em]"}`}>
        <dt className="sr-only">Time</dt>
        <dd className="flex-shrink-0 whitespace-nowrap">{formatEventTime(event.startAt)} WAT</dd>
        {location && (
          <>
            <span aria-hidden="true" className={`flex-shrink-0 text-[#C9C2C5] ${compact ? "mx-1.5" : "mx-2"}`}>·</span>
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
          <a href={event.liveUrl} target="_blank" rel="noopener noreferrer" className={actionClasses}>
            {event.primaryCtaLabel || "Join live"}
            <Icon icon={ArrowRight} size={arrowSize} />
          </a>
        ) : takingRsvps ? (
          <button
            type="button"
            onClick={onRegister}
            disabled={registering || registered}
            className={`${actionClasses} disabled:cursor-default ${registered ? "text-emerald-700 hover:text-emerald-700" : ""}`}
          >
            {registering ? "Registering…" : registered ? "Registered" : "Register"}
            {registered ? <Icon icon={Check} size={arrowSize} /> : <Icon icon={ArrowRight} size={arrowSize} />}
          </button>
        ) : (
          <Link href={href} className={actionClasses}>
            See details
            <Icon icon={ArrowRight} size={arrowSize} />
          </Link>
        )}
      </div>
    </div>
  );
}
