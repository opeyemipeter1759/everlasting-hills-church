"use client";

import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";
import type { LatestSermon } from "@/types";
import { formatDate, formatDuration, getTypeLabel } from "./sermonUtils";

export default function SermonCard({ sermon, onPlay }: { sermon: LatestSermon; onPlay: (sermon: LatestSermon) => void }) {
  return (
    <article className="group overflow-hidden rounded border border-white/8 bg-[#131313] shadow-[0_10px_24px_rgba(0,0,0,0.22)] transition-transform hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={sermon.thumbnailUrl ?? "/fallback.jpg"} alt={sermon.title} className="h-full w-full  object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2.5">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-[#87102C] shadow-sm">{formatDuration(sermon.audioDuration)}</span>
          <button type="button" onClick={() => onPlay(sermon)} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#87102C] shadow-[0_10px_20px_rgba(0,0,0,0.28)] transition-transform hover:scale-105" aria-label={`Play ${sermon.title}`}>
            <Play className="h-3.5 w-3.5 fill-current" />
          </button>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-semibold leading-tight text-white">{sermon.title}</h3>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-white/42">
              <span className="truncate text-white/70">{sermon.speaker}</span>
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span className="text-white/40">{formatDate(sermon.date ?? sermon.publishedAt ?? sermon.createdAt)}</span>
            </div>
          </div>

          <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-medium text-white/55">{getTypeLabel(sermon)}</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="text-[10px] text-white/35">{sermon.playCount} plays</div>
        </div>
      </div>
    </article>
  );
}
