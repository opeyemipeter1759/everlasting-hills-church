"use client";

import { useState } from "react";
import { Icon, Megaphone } from "@/components/icons";
import FormModal from "@/components/ui/overlay/FormModal";
import { stripMarkdown } from "@/lib/rich-text";
import { AnnouncementRow, type Announcement } from "./AnnouncementCard";

/** Seconds per announcement, so a longer list scrolls at the same reading speed rather than faster. */
const SECONDS_EACH = 9;

/**
 * The announcements as a strip scrolling like a shop's sale banner: a card at
 * the top of the dashboard, or a bar across the whole screen on the homepage. It pauses under the pointer or keyboard focus, and tapping
 * one opens it in full. With reduced motion it stands still and scrolls sideways
 * by hand. Nothing shows when there are no announcements.
 */
export function AnnouncementTicker({ announcements, variant = "card" }: { announcements: Announcement[]; variant?: "card" | "bar" }) {
  const [open, setOpen] = useState<Announcement | null>(null);
  if (announcements.length === 0) return null;

  const item = (a: Announcement, copy: 0 | 1) => {
    const snippet = stripMarkdown(a.body).replace(/\s+/g, " ").trim();
    return (
      <button
        key={`${copy}-${a.id}`}
        type="button"
        onClick={() => setOpen(a)}
        // The second copy only completes the loop: hidden from screen readers and the tab order.
        aria-hidden={copy === 1 || undefined}
        tabIndex={copy === 1 ? -1 : undefined}
        className="flex shrink-0 items-center gap-2 px-5 text-left text-[13px] text-white/90 hover:text-white focus-visible:underline focus-visible:outline-none"
      >
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#FFB3C1]" />
        <span className="font-bold text-white">{a.title}</span>
        {snippet && <span className="max-w-[28ch] truncate text-white/70 sm:max-w-[48ch]">{snippet}</span>}
      </button>
    );
  };

  return (
    <>
      <section
        aria-label="Announcements"
        className={`group flex items-stretch overflow-hidden text-white ${variant === "card" ? "rounded-2xl shadow-sm" : "w-full"}`}
        style={{ background: "linear-gradient(135deg, #2a0410 0%, #4a0819 50%, #87102C 100%)" }}
      >
        <span className="flex flex-shrink-0 items-center gap-1.5 bg-black/20 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#FFB3C1]">
          <Icon icon={Megaphone} size={14} />
          <span className="md:hidden">Info</span>
          <span className="hidden md:inline">Announcements</span>
        </span>
        <div className="relative min-w-0 flex-1 overflow-x-auto no-scrollbar motion-safe:overflow-hidden">
          <div
            className="flex w-max items-center py-2.5 motion-safe:animate-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
            style={{ animationDuration: `${Math.max(20, announcements.length * SECONDS_EACH)}s` }}
          >
            {announcements.map((a) => item(a, 0))}
            {/* A second copy, so the loop runs on without a gap (the animation slides exactly half way). */}
            <span className="hidden motion-safe:contents">{announcements.map((a) => item(a, 1))}</span>
          </div>
        </div>
      </section>
      <FormModal open={!!open} title="Announcement" onClose={() => setOpen(null)}>
        {open && <AnnouncementRow a={open} isNewest={false} index={0} />}
      </FormModal>
    </>
  );
}
