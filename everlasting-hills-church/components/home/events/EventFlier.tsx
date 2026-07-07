"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { EventSummary } from "@/types";
import FallbackArt from "./FallbackArt";

interface EventFlierProps {
  event: EventSummary;
  dayNum: string;
  monthShort: string;
  countdown: string;
}

export default function EventFlier({ event, dayNum, monthShort, countdown }: EventFlierProps) {
  const [flyerOk, setFlyerOk] = useState(Boolean(event.flyerImageUrl));

  return (
    <div className="relative aspect-[4/3] flex-shrink-0 bg-[#0E020A]">
      {flyerOk && event.flyerImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.flyerImageUrl}
          alt={event.title}
          onError={() => setFlyerOk(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <FallbackArt />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-black/5 pointer-events-none" />

      {event.featured && (
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#87102C] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white shadow-lg">
          <Sparkles size={10} /> Featured
        </span>
      )}

      <div className="absolute top-3 right-3 flex flex-col items-center justify-center rounded-xl bg-white px-2.5 py-1.5 leading-none shadow-lg">
        <span className="text-[9px] font-bold uppercase tracking-wider text-[#87102C]">{monthShort}</span>
        <span className="text-lg font-black text-[#111]">{dayNum}</span>
      </div>

      {countdown && (
        <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
          {countdown}
        </span>
      )}
    </div>
  );
}
