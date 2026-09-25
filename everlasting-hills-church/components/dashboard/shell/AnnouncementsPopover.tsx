"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BellRing, Clock, MapPin, Megaphone, X } from "lucide-react";
import {
  announcementHref,
  useAnnouncementsFeed,
  type AnnouncementFeedItem,
} from "@/lib/api/announcements";
import { stripMarkdown } from "@/lib/rich-text";
import { formatHHMM12h } from "@/lib/utils/time";

/** Remembers the newest announcement this browser has already been shown. */
const SEEN_KEY = "ehc-announcements-seen";

function readSeen(): string | null {
  try {
    return window.localStorage.getItem(SEEN_KEY);
  } catch {
    // Private windows and blocked site data throw here. Failing to read just
    // means the popover shows — better than it never showing at all.
    return null;
  }
}

function writeSeen(id: string) {
  try {
    window.localStorage.setItem(SEEN_KEY, id);
  } catch {
    /* nothing to do — it will simply show again next time */
  }
}

function relativeTime(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "Last week" : `${weeks} weeks ago`;
}

function Row({ a }: { a: AnnouncementFeedItem }) {
  const href = announcementHref(a);
  const preview = stripMarkdown(a.body);

  const body = (
    <>
      {a.imageUrl ? (
        <span className="relative hidden h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5 xs:block">
          <Image src={a.imageUrl} alt="" fill sizes="56px" className="object-cover" />
        </span>
      ) : (
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]">
          <Megaphone size={15} aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold leading-snug text-[#111] dark:text-white">
          {a.title}
        </span>
        <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-gray-500 [overflow-wrap:anywhere] dark:text-gray-400">
          {preview}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {a.eventTime && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#87102C] dark:text-[#e8768a]">
              <Clock size={9} aria-hidden="true" />
              {formatHHMM12h(a.eventTime)}
            </span>
          )}
          {a.venue && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#87102C] dark:text-[#e8768a]">
              <MapPin size={9} aria-hidden="true" />
              {a.venue}
            </span>
          )}
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {relativeTime(a.createdAt)}
          </span>
          {href && (
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-[#87102C] dark:text-[#e8768a]">
              View event
              <ArrowRight size={11} aria-hidden="true" />
            </span>
          )}
        </span>
      </span>
    </>
  );

  const shell =
    "flex gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02]";

  if (!href) return <li className={shell}>{body}</li>;
  return (
    <li>
      <Link
        href={href}
        className={`${shell} transition-colors hover:border-[#87102C]/30 hover:bg-[#FFF4F6] dark:hover:bg-white/[0.06]`}
      >
        {body}
      </Link>
    </li>
  );
}

/**
 * What the church has said, shown once on arriving at the dashboard.
 *
 * It opens only when there is something newer than the last announcement this
 * browser was shown, so it greets a member with real news rather than nagging
 * on every navigation. Dismissing marks the newest as seen; the same list stays
 * available in the notification bell and on the member home.
 */
export default function AnnouncementsPopover() {
  const { data: announcements = [] } = useAnnouncementsFeed();
  const [open, setOpen] = useState(false);

  const newest = announcements[0]?.id ?? null;

  useEffect(() => {
    if (!newest) return;
    if (readSeen() === newest) return;
    setOpen(true);
  }, [newest]);

  // Escape closes, and the page behind must not scroll while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    if (newest) writeSeen(newest);
    setOpen(false);
  }

  if (!open || announcements.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Church announcements"
      className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />
      <div className="relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#E7CDD3]/60 bg-white shadow-2xl dark:border-white/10 dark:bg-[#140b10]">
        <div
          className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5"
          style={{ background: "linear-gradient(135deg, #2a0410 0%, #4a0819 50%, #87102C 100%)" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15">
              <BellRing size={15} className="text-[#FFB3C1]" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#FFB3C1]/70 xs:tracking-[0.22em]">
                From the Church
              </p>
              <h2 className="truncate text-sm font-bold text-white">Announcements</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close announcements"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* The list scrolls, not the dialog — the header and footer stay put. */}
        <ul className="flex-1 space-y-2.5 overflow-y-auto p-4">
          {announcements.map((a) => (
            <Row key={a.id} a={a} />
          ))}
        </ul>

        <div className="border-t border-[#E7CDD3]/40 bg-[#FFF4F6]/40 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02] sm:px-5">
          <button
            type="button"
            onClick={close}
            className="w-full rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6E0C24]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
