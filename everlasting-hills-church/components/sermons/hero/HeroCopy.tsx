"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Play } from "lucide-react";
import type { SermonHeroSlide } from "./types";


export default function HeroCopy({
  slide,
  onPlay,
}: {
  slide: SermonHeroSlide;
  onPlay?: (slug: string) => void;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${slide.title}-copy`}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#FFB3C1]">
          {slide.label}
        </span>

        <h1 className="mt-4 line-clamp-2 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
          {slide.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-white/55">
          <span className="font-semibold text-white/85">{slide.speaker}</span>
          {slide.scripture && (
            <>
              <span className="text-white/25">·</span>
              <span>{slide.scripture}</span>
            </>
          )}
        </div>

        <p className="mt-4 line-clamp-2 max-w-md text-sm leading-relaxed text-white/50">
          {slide.description}
          {slide.reactions && <span className="text-white/35"> — {slide.reactions}</span>}
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          {onPlay && slide.slug ? (
            <button
              type="button"
              onClick={() => onPlay(slide.slug)}
              className="inline-flex items-center gap-2.5 rounded-full bg-white px-5 py-3 text-sm font-black text-[#87102C] shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition-transform duration-200 hover:scale-[1.03] active:scale-95"
            >
              <Play className="h-4 w-4 fill-current" />
              Play Now
            </button>
          ) : (
            <Link
              href={slide.href}
              className="inline-flex items-center gap-2.5 rounded-full bg-white px-5 py-3 text-sm font-black text-[#87102C] shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition-transform duration-200 hover:scale-[1.03] active:scale-95"
            >
              <Play className="h-4 w-4 fill-current" />
              Play Now
            </Link>
          )}
          <Link
            href="/sermons"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white/75 transition-colors hover:border-white/35 hover:text-white"
          >
            All sermons
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
