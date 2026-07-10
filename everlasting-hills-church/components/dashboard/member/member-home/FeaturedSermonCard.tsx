"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Mic, BookOpen, Play, Pause } from "lucide-react";
import type { MemberHomeProps } from "./types";
import { card, hdrBdr, iconBg, iconCl, kicker, cardTitle, muted } from "./tokens";
import { fmtDate } from "./helpers";

export function FeaturedSermonCard({ sermon }: {
  sermon: NonNullable<MemberHomeProps["featuredSermon"]>;
}) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { void audioRef.current.play(); setPlaying(true); }
  }

  return (
    <section className={card}>
      <div className={`flex items-center justify-between gap-3 ${hdrBdr} px-5 py-4 sm:px-6`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className={iconBg}>
            <Mic size={15} className={iconCl} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className={kicker}>This Week</p>
            <h3 className={`${cardTitle} truncate`}>Featured Sermon</h3>
          </div>
        </div>
        <span className="text-[10px] font-bold text-[#87102C] dark:text-[#FFB3C1] bg-[#FFE8ED] dark:bg-[#87102C]/25 px-2.5 py-1 rounded-full uppercase tracking-wide">
          Featured
        </span>
      </div>

      <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-full sm:w-52">
          {sermon.thumbnailUrl ? (
            <img src={sermon.thumbnailUrl} alt={sermon.title}
              className="w-full sm:w-52 aspect-video rounded-xl object-cover" />
          ) : (
            <div className="w-full sm:w-52 aspect-video rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center">
              <BookOpen size={28} className={iconCl} />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-base font-bold text-[#111] dark:text-white leading-snug">{sermon.title}</p>
            <p className={`text-xs ${muted} mt-1`}>
              {sermon.speaker} · {fmtDate(sermon.date, { day: "numeric", month: "long", year: "numeric" })}
            </p>
            {sermon.description && (
              <p className={`text-xs ${muted} mt-2.5 leading-relaxed line-clamp-3`}>
                {sermon.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sermon.audioUrl ? (
              <>
                <audio ref={audioRef} src={sermon.audioUrl} onEnded={() => setPlaying(false)} />
                <button
                  type="button"
                  onClick={togglePlay}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#87102C] text-white text-xs font-semibold hover:bg-[#6E0C24] hover:-translate-y-0.5 transition-all shadow-sm shadow-[#87102C]/20"
                >
                  {playing ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
                  {playing ? "Pause" : "Play"}
                </button>
              </>
            ) : null}
            <Link href={`/sermons/${sermon.slug}`}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold hover:-translate-y-0.5 transition-all w-fit ${
                sermon.audioUrl
                  ? "bg-gray-100 dark:bg-white/10 text-[#111] dark:text-white hover:bg-gray-200 dark:hover:bg-white/15"
                  : "bg-[#87102C] text-white hover:bg-[#6E0C24] shadow-sm shadow-[#87102C]/20"
              }`}
            >
              <BookOpen size={12} />
              {sermon.audioUrl ? "Full sermon" : "Listen now"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
