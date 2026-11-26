"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CalendarDots, CaretDown, Clock, Icon, MapPin, Megaphone } from "@/components/icons";
import RichText from "@/components/ui/display/RichText";
import { stripMarkdown } from "@/lib/rich-text";
import { formatHHMM12h } from "@/lib/utils/time";
import { announcementWhen } from "@/lib/announcement-when";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  createdAt: string;
  eventTime?: string | null;
  venue?: string | null;
  Event?: { startAt?: string | null } | null;
}

/** One announcement in full: its image, the text (long ones fold open), and when and where. */
export function AnnouncementRow({ a, isNewest, index }: { a: Announcement; isNewest: boolean; index: number }) {
  const [expanded, setExpanded] = useState(false);
  // Measured on the plain-text form: a body that is mostly Markdown markers is
  // shorter than it looks, and clamping it would hide nothing.
  const preview = stripMarkdown(a.body);
  const clampable = preview.length > 140;
  const when = announcementWhen(a);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      className={`group flex gap-3 rounded-xl border p-3.5 transition-all ${
        isNewest
          ? "border-[#87102C]/25 dark:border-[#FFB3C1]/20 bg-[#FFF4F6] dark:bg-[#87102C]/10"
          : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/20"
      }`}
    >
      {a.imageUrl ? (
        <div className="relative hidden h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5 sm:block">
          <Image src={a.imageUrl} alt="" fill sizes="64px" className="object-cover" />
        </div>
      ) : (
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
            isNewest
              ? "bg-[#87102C]/15 text-[#87102C] dark:bg-[#FFB3C1]/15 dark:text-[#FFB3C1]"
              : "bg-gray-100 text-gray-400 dark:bg-white/8 dark:text-white/40"
          }`}
        >
          <Icon icon={Megaphone} size={15} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold leading-snug ${isNewest ? "text-[#87102C] dark:text-[#FFB3C1]" : "text-[#111] dark:text-white"}`}>
            {a.title}
          </p>
          {isNewest && (
            <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1] bg-[#FFE8ED] dark:bg-[#87102C]/25 px-2 py-0.5 rounded-full mt-0.5">
              New
            </span>
          )}
        </div>

        {/* Collapsed shows the stripped single-run text: CSS line-clamp cannot
            span the paragraphs and lists the expanded view renders. */}
        {expanded ? (
          <RichText
            text={a.body}
            density="tight"
            emphasisClassName="text-gray-900 dark:text-white"
            className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300"
          />
        ) : (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400 [overflow-wrap:anywhere]">
            {preview}
          </p>
        )}

        {(a.eventTime || a.venue) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            {a.eventTime && (
              <p className="text-[11px] font-semibold text-[#87102C] dark:text-[#e8768a] flex items-center gap-1">
                <Icon icon={Clock} size={11} className="flex-shrink-0" />
                {formatHHMM12h(a.eventTime)}
              </p>
            )}
            {a.venue && (
              <p className="text-[11px] font-semibold text-[#87102C] dark:text-[#e8768a] flex items-center gap-1">
                <Icon icon={MapPin} size={11} className="flex-shrink-0" />
                {a.venue}
              </p>
            )}
          </div>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          {/* The event's own date, or the real date it was posted: never "Today" unless it is. */}
          <p className={`flex items-center gap-1 text-[11px] ${when.isEvent ? "font-semibold text-[#87102C] dark:text-[#e8768a]" : "text-gray-400 dark:text-gray-500"}`}>
            <Icon icon={CalendarDots} size={11} className="flex-shrink-0" />
            {when.label}
          </p>
          {clampable && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#87102C] dark:text-[#e8768a] hover:underline"
            >
              {expanded ? "Show less" : "Read more"}
              <Icon icon={CaretDown} size={11} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
