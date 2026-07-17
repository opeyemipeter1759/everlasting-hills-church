import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import type { EventDetail } from "@/types";
import { formatRange } from "../events-cms/helpers";

export default function EventRsvpsHero({ event }: { event: EventDetail }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] overflow-hidden">
      <div className="relative h-40 sm:h-48 bg-[#FFE8ED] dark:bg-[#87102C]/20">
        {event.flyerImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.flyerImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <Link
          href="/dashboard/admin/events"
          className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-black/50 transition-colors"
        >
          <ArrowLeft size={13} /> All events
        </Link>

        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            {event.status === "PUBLISHED" ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/90 text-white">
                Published
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 text-white">
                Draft
              </span>
            )}
            {event.featured && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#87102C] text-white">
                Featured
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">{event.title}</h1>
        </div>
      </div>

      <div className="p-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={14} /> {formatRange(event.startAt, event.endAt)}
        </span>
        {event.venueName && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} /> {event.venueName}
          </span>
        )}
      </div>
    </div>
  );
}
