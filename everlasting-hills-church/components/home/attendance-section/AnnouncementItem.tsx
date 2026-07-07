"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import type { Announcement } from "@/hooks";
import { absoluteDate, formatTime, relativeTime } from "./utils";
import { getAnnouncementIcon } from "./getAnnouncementIcon";

interface AnnouncementItemProps {
  announcement: Announcement;
  isNew: boolean;
}

export default function AnnouncementItem({ announcement, isNew }: AnnouncementItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = announcement.body.length > 140;
  const Icon = getAnnouncementIcon(announcement.title);

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border px-4 py-3.5 transition-all ${
        isNew
          ? "border-[#87102C]/40 bg-gradient-to-br from-[#87102C]/20 via-[#87102C]/5 to-transparent"
          : "border-white/[0.07] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.05]"
      }`}
    >
      {isNew && (
        <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[#FFB3C1] to-[#87102C]" />
      )}
      <div className="flex gap-3">
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
            isNew ? "bg-[#87102C]/35 text-[#FFB3C1]" : "bg-white/8 text-white/50"
          }`}
        >
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-[13px] font-bold leading-snug ${isNew ? "text-[#FFB3C1]" : "text-white"}`}>
              {announcement.title}
            </p>
            {isNew && (
              <span className="mt-0.5 flex-shrink-0 rounded-full bg-[#87102C]/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#FFB3C1]">
                New
              </span>
            )}
          </div>
          <p className={`mt-1.5 text-xs leading-relaxed text-white/50 ${expanded ? "" : "line-clamp-2"}`}>
            {announcement.body}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white/90"
              title={absoluteDate(announcement.createdAt)}
            >
              <Clock size={9} className="flex-shrink-0 text-[#FFB3C1]" />
              {formatTime(announcement.createdAt)}
            </span>
            <p className="text-[10px] text-white/35">{relativeTime(announcement.createdAt)}</p>
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-[10px] font-bold text-[#FFB3C1]/80 transition-colors hover:text-[#FFB3C1]"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
