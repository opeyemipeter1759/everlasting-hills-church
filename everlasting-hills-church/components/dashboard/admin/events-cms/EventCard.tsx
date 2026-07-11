"use client";

import { CalendarDays, CheckCircle2, EyeOff, Pencil, Trash2, Users } from "lucide-react";
import Loader from "@/components/ui/feedback/Loader";
import type { EventDetail } from "@/types";
import { formatRange } from "./helpers";

export default function EventCard({
  event: ev,
  onOpenRsvps,
  onTogglePublish,
  onEdit,
  onDelete,
  isToggling = false,
}: {
  event: EventDetail;
  onOpenRsvps: (ev: EventDetail) => void;
  onTogglePublish: (ev: EventDetail) => void;
  onEdit: (ev: EventDetail) => void;
  onDelete: (ev: EventDetail) => void;
  isToggling?: boolean;
}) {
  const rsvpCount = ev._count?.Rsvps ?? 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenRsvps(ev)}
      onKeyDown={(e) => e.key === "Enter" && onOpenRsvps(ev)}
      className="group bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-[#87102C]/30 hover:shadow-md transition-all flex flex-col"
    >
      <div className="h-32 bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center overflow-hidden">
        {ev.flyerImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ev.flyerImageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <CalendarDays size={28} className="text-[#87102C]" />
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          {ev.status === "PUBLISHED" ? (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              Published
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400">
              Draft
            </span>
          )}
          {ev.featured && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFE8ED] text-[#87102C]">
              Featured
            </span>
          )}
        </div>

        <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{ev.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formatRange(ev.startAt, ev.endAt)}
          {ev.venueName ? ` · ${ev.venueName}` : ""}
        </p>

        <div className="flex items-center justify-between mt-auto pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#87102C] dark:text-[#e8768a]">
            <Users size={13} />
            {rsvpCount} RSVP{rsvpCount === 1 ? "" : "s"}
          </span>

          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onTogglePublish(ev)}
              disabled={isToggling}
              title={ev.status === "PUBLISHED" ? "Unpublish" : "Publish"}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {isToggling ? (
                <Loader size="xs" />
              ) : ev.status === "PUBLISHED" ? (
                <EyeOff size={14} />
              ) : (
                <CheckCircle2 size={14} />
              )}
            </button>
            <button
              type="button"
              onClick={() => onEdit(ev)}
              title="Edit"
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(ev)}
              title="Delete"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
