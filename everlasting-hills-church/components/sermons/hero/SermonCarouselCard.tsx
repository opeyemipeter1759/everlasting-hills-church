"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Headphones, Play } from "lucide-react";
import type { SermonHeroSlide } from "./types";

/** One card, all sermons — the active sermon's art fills the frame and slides up/down as
 * you move through the rotation (up when moving forward, down when moving back). A thumbnail
 * rail down the side shows the rest of the lineup and jumps straight to whichever you tap. */
export default function SermonCarouselCard({
  slides,
  active,
  onPlay,
  onJump,
  className = "",
}: {
  slides: SermonHeroSlide[];
  active: number;
  onPlay?: (slug: string) => void;
  onJump: (index: number) => void;
  className?: string;
}) {
  const prevActive = useRef(active);
  const direction = active >= prevActive.current ? 1 : -1;
  useEffect(() => {
    prevActive.current = active;
  }, [active]);

  const slide = slides[active];
  if (!slide) return null;

  return (
    <div className={`relative flex gap-2.5 ${className}`}>
      <div className="relative flex-1 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={slide.image}
            initial={{ y: direction * 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: direction * -48, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />

            {onPlay && slide.slug ? (
              <button
                type="button"
                onClick={() => onPlay(slide.slug)}
                aria-label="Play"
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#87102C] shadow-2xl transition-transform hover:scale-110">
                  <Play className="h-5 w-5 fill-current" />
                </span>
              </button>
            ) : null}

            <div className="absolute bottom-4 left-4 right-4">
              <p className="line-clamp-1 text-base font-bold text-white">{slide.title}</p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-white/70">
                <span>{slide.speaker}</span>
                <span className="text-white/30">·</span>
                <span className="inline-flex items-center gap-1">
                  <Headphones className="h-3 w-3" />
                  {slide.duration}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <div className="hidden w-14 flex-col gap-2 overflow-y-auto sm:flex">
          {slides.map((s, i) => (
            <button
              key={`${s.title}-${i}`}
              type="button"
              onClick={() => onJump(i)}
              aria-label={`Go to ${s.title}`}
              aria-current={i === active}
              className={`relative aspect-square shrink-0 overflow-hidden rounded-xl border transition-all ${
                i === active ? "border-white/70 opacity-100" : "border-white/10 opacity-45 hover:opacity-75"
              }`}
            >
              <img src={s.image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
