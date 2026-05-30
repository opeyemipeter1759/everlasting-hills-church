"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Heart, Play, Sparkles } from "lucide-react";
import { useLatestSermons } from "@/lib/api";

export type SermonHeroSlide = {
  title: string;
  speaker: string;
  scripture: string;
  description: string;
  label: string;
  image: string;
  href: string;
  duration: string;
  reactions: string;
  accent?: string;
};

export type SermonHeroProps = {
  slides?: SermonHeroSlide[];
  title?: string;
  subtitle?: string;
  eyebrow?: string;
};


const AUTO_ROTATE_MS = 9000;
const DEFAULT_SERMON_IMAGE =
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=80";

const FALLBACK_SLIDE: SermonHeroSlide = {
  title: "Latest sermon",
  speaker: "Everlasting Hills",
  scripture: "",
  description: "A recent message from Everlasting Hills Church.",
  label: "Latest",
  image: DEFAULT_SERMON_IMAGE,
  href: "/sermons",
  duration: "",
  reactions: "0 plays",
  accent: "from-[#87102C] via-[#6E0C24] to-[#120608]",
};

export default function SermonHero({
  slides = [],
}: SermonHeroProps) {
  const { data: latestSermons } = useLatestSermons();
  const latestSlides = useMemo<SermonHeroSlide[]>(() => {
    return (
      latestSermons?.map((item, index) => ({
        title: item.title,
        speaker: item.speaker,
        scripture: item.scriptureRef ?? item.series ?? "Latest sermon",
        description:
          item.description ??
          (item.tags.length > 0 ? item.tags.join(" · ") : "A recent message from Everlasting Hills Church."),
        label: item.isFeatured ? "Featured sermon" : item.series ?? "Latest sermon",
        image: item.thumbnailUrl ?? DEFAULT_SERMON_IMAGE,
        href: item.slug ? `/sermons/${item.slug}` : "/sermons",
        duration: item.audioDuration ? `${Math.ceil(item.audioDuration / 60)} min` : item.videoUrl ? "Video" : "Sermon",
        reactions: `${item.playCount} play${item.playCount === 1 ? "" : "s"}`,
        accent:
          index % 3 === 0
            ? "from-[#87102C] via-[#6E0C24] to-[#120608]"
            : index % 3 === 1
              ? "from-[#2a1216] via-[#87102C] to-[#0a0a0a]"
              : "from-[#3b0714] via-[#87102C] to-[#14070b]",
      })) ?? []
    );
  }, [latestSermons]);

  const safeSlides = useMemo<SermonHeroSlide[]>(() => {
    if (slides.length > 0) return slides;
    if (latestSlides.length > 0) return latestSlides;
    return [];
  }, [slides, latestSlides]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (active >= safeSlides.length) {
      setActive(0);
    }
  }, [active, safeSlides.length]);

  useEffect(() => {
    if (paused || safeSlides.length < 2) return;

    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % safeSlides.length);
    }, AUTO_ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [paused, safeSlides.length]);

  const slide = safeSlides[active] ?? safeSlides[0] ?? FALLBACK_SLIDE;

  return (
    <section className="relative overflow-hidden bg-[#0a0a0a] text-white" aria-roledescription="carousel" aria-label="Sermon highlights">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.12),rgba(10,10,10,0.92))]" />
        <div className="absolute inset-0 bg-grid-white opacity-[0.22]" />
      </div>

      <div className="relative w-full px-0 py-0">
        <div
          className="group relative w-full overflow-hidden border border-white/10 bg-black shadow-[0_26px_90px_rgba(0,0,0,0.52)]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.image}
              initial={{ opacity: 0.92, x: 10, scale: 1.01 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0.92, x: -10, scale: 1.01 }}
              transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-[70vh] max-h-[70vh] w-full"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${slide.accent ?? "from-[#87102C] via-[#6E0C24] to-[#120608]"} opacity-80`} />
              <img
                src={slide.image}
                alt={slide.title}
                  className="h-full w-full object-cover opacity-72 mix-blend-screen"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.45)_38%,rgba(0,0,0,0.12)_70%,rgba(0,0,0,0.6)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.18)_64%,rgba(0,0,0,0.82)_100%)]" />

              <button
                type="button"
                onClick={() => setActive((index) => (index - 1 + safeSlides.length) % safeSlides.length)}
                className="absolute left-4 top-1/2 z-20 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100 group-hover:scale-105 hover:bg-black/50 sm:left-6"
                aria-label="Previous sermon"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={() => setActive((index) => (index + 1) % safeSlides.length)}
                className="absolute right-4 top-1/2 z-20 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100 group-hover:scale-105 hover:bg-black/50 sm:right-6"
                aria-label="Next sermon"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6 lg:p-8 py-20">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    {/* <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45 }}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80 backdrop-blur-md"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#FFB3C1]" />
                      {eyebrow}
                    </motion.p> */}

                    <motion.div
                      key={`${slide.title}-copy`}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.45 }}
                      className="mt-20 max-w-3xl"
                    >
                      <h1 className="max-w-3xl text-2xl font-black leading-[0.92] tracking-tight text-white  ">
                        {slide.title}
                      </h1>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/72">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/30 px-3.5 py-2 backdrop-blur-md">
                          <BookOpen className="h-4 w-4  text-[#FFB3C1]" />
                          {slide.scripture}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/30 px-3.5 py-2 backdrop-blur-md">
                          <Heart className="h-4 w-4 text-[#FFB3C1]" />
                          {slide.reactions}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/30 px-3.5 py-2 backdrop-blur-md text-white/58">
                          {slide.speaker}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/30 px-3.5 py-2 backdrop-blur-md text-white/58">
                          {slide.duration}
                        </span>
                      </div>

                      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/74 sm:text-lg">
                        {slide.description}
                      </p>
                    </motion.div>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <Link
                        href={slide.href}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#87102C] shadow-[0_18px_44px_rgba(255,255,255,0.12)] transition-transform hover:-translate-y-0.5 hover:bg-[#FFE8ED]"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        Play message
                      </Link>
                      <Link
                        href={slide.href}
                        className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-black/28 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-white/26 hover:bg-white/10"
                      >
                        View sermon
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-4 lg:flex-col lg:items-end">
                    <div className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/72 backdrop-blur-md">
                      {slide.label}
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md">
                      {safeSlides.map((item, index) => (
                        <button
                          key={item.title}
                          type="button"
                          onClick={() => setActive(index)}
                          className={`h-2.5 rounded-full transition-all ${index === active ? "w-10 bg-[#FFB3C1]" : "w-2.5 bg-white/35 hover:bg-white/55"}`}
                          aria-label={`Go to sermon slide ${index + 1}`}
                          aria-pressed={index === active}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
