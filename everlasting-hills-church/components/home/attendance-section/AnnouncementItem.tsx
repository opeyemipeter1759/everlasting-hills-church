"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock, MapPin } from "lucide-react";
import type { Announcement } from "@/hooks";
import { formatHHMM12h } from "@/lib/utils/time";
import { getAnnouncementIcon } from "./getAnnouncementIcon";
import RichText from "@/components/ui/display/RichText";
import { stripMarkdown } from "@/lib/rich-text";

interface AnnouncementItemProps {
  announcement: Announcement;
  isNew: boolean;
}

export default function AnnouncementItem({ announcement, isNew }: AnnouncementItemProps) {
  const [expanded, setExpanded] = useState(false);
  // Length is measured on the plain-text form: a body that is mostly Markdown
  // markers is shorter than it looks, and clamping it would hide nothing.
  const preview = stripMarkdown(announcement.body);
  const isLong = preview.length > 140;
  const Icon = getAnnouncementIcon(announcement.title);

  return (
    <div
      className={`group relative flex gap-3 overflow-hidden rounded-xl border px-4 py-3.5 transition-all ${
        isNew
          ? "border-[#87102C]/40 bg-gradient-to-br from-[#87102C]/20 via-[#87102C]/5 to-transparent"
          : "border-white/[0.07] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.05]"
      }`}
    >
      {isNew && (
        <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[#FFB3C1] to-[#87102C]" />
      )}
      {announcement.imageUrl ? (
        <div className="relative hidden h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-white/5 sm:block">
          <Image src={announcement.imageUrl} alt="" fill sizes="80px" className="object-cover" />
        </div>
      ) : (
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
            isNew ? "bg-[#87102C]/35 text-[#FFB3C1]" : "bg-white/8 text-white/50"
          }`}
        >
          <Icon size={16} />
        </span>
      )}
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
        {/* Collapsed shows the stripped single-run text: CSS line-clamp cannot
            span the paragraphs and lists the expanded view renders. */}
        {expanded ? (
          <RichText
            text={announcement.body}
            density="tight"
            emphasisClassName="text-white"
            linkClassName="text-[#FFB3C1]"
            className="mt-1.5 text-xs leading-relaxed text-white/60"
          />
        ) : (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/50 [overflow-wrap:anywhere]">
            {preview}
          </p>
        )}
        {(announcement.eventTime || announcement.venue) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {announcement.eventTime && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] py-1 pl-1 pr-2.5">
                <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#87102C]/40 text-[#FFB3C1]">
                  <Clock size={9} />
                </span>
                <span className="text-[10px] font-bold text-white/75">{formatHHMM12h(announcement.eventTime)}</span>
              </span>
            )}
            {announcement.venue && (
              <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] py-1 pl-1 pr-2.5">
                <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#87102C]/40 text-[#FFB3C1]">
                  <MapPin size={9} />
                </span>
                <span className="truncate text-[10px] font-bold text-white/75">{announcement.venue}</span>
              </span>
            )}
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
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
  );
}
