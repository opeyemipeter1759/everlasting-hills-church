"use client";

import { motion } from "framer-motion";
import { Headphones, Play } from "lucide-react";
import type { SermonHeroSlide } from "./types";

const BAR_COUNT = 28;

/** No-image companion to the sermon hero copy — an animated waveform + play
 * control standing in for photography, the way audio-first platforms (Spotify,
 * Apple Podcasts) present a "now playing" panel. */
export default function SermonWaveform({
  slide,
  onPlay,
  className = "",
}: {
  slide: SermonHeroSlide;
  onPlay?: (slug: string) => void;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.015] ${className}`}
    >
      {/* Ambient glow — the only "color" here, no imagery */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[38%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#87102C]/25 blur-[110px]" />
        <div className="absolute inset-0 bg-grain opacity-[0.05] mix-blend-overlay" />
      </div>

      <div className="relative flex h-full flex-col items-center justify-center px-6 pb-16 pt-8">
        {onPlay && slide.slug ? (
          <button
            type="button"
            onClick={() => onPlay(slide.slug)}
            aria-label="Play"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-[#87102C] shadow-2xl transition-transform hover:scale-110"
          >
            <Play className="h-6 w-6 fill-current" />
          </button>
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white/70">
            <Headphones className="h-6 w-6" />
          </span>
        )}

        <div className="mt-8 flex h-14 items-end gap-[3px]" aria-hidden="true">
          {Array.from({ length: BAR_COUNT }).map((_, i) => (
            <motion.span
              key={i}
              className="w-[3px] rounded-full bg-gradient-to-t from-[#87102C] to-[#FFB3C1]"
              animate={{
                height: [`${20 + (i % 5) * 8}%`, `${42 + (i % 7) * 8}%`, `${20 + (i % 5) * 8}%`],
              }}
              transition={{
                duration: 1.4 + (i % 4) * 0.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.04,
              }}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 text-center">
        <p className="line-clamp-1 text-base font-bold text-white">{slide.title}</p>
        <div className="mt-1 flex items-center justify-center gap-2 text-[11px] text-white/70">
          <span>{slide.speaker}</span>
          <span className="text-white/30">·</span>
          <span className="inline-flex items-center gap-1">
            <Headphones className="h-3 w-3" />
            {slide.duration}
          </span>
        </div>
      </div>
    </div>
  );
}
