"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { EventSummary } from "@/types";
import FallbackArt from "./FallbackArt";

interface EventFlierProps {
  event: EventSummary;
  href: string;
  /** Top-right chip: "Tomorrow · 5:00 PM WAT", "Upcoming", "Happening now"… */
  status: string;
  /** Small buttons pinned top-left (share, WhatsApp, invite). */
  actions?: ReactNode;
}

/**
 * Banner across the top of the card. The image links to the event page; the action
 * buttons sit on top of it as siblings (a button can't live inside a link).
 */
export default function EventFlier({ event, href, status, actions }: EventFlierProps) {
  const image = event.coverImageUrl || event.flyerImageUrl;
  const [flyerOk, setFlyerOk] = useState(Boolean(image));

  return (
    <div className="relative aspect-[16/9] flex-shrink-0 overflow-hidden border-b border-[#ECE7E9] bg-[#F4F2F5]">
      <Link
        href={href}
        aria-label={`View details: ${event.title}`}
        className="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#87102C]/50"
      >
        {flyerOk && image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setFlyerOk(false)}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <FallbackArt title={event.theme || event.title} />
        )}
      </Link>

      {actions && <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">{actions}</div>}

      {status && (
        <span className="pointer-events-none absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#87102C] shadow-sm backdrop-blur">
          {status === "Happening now" && (
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
          )}
          {status}
        </span>
      )}
    </div>
  );
}
