"use client";

import { useEffect, useMemo, useState } from "react";
import { useLatestSermons } from "@/lib/api";
import Marquee from "./hero/Marquee";
import StoryProgress from "./hero/StoryProgress";
import SermonCarouselCard from "./hero/SermonCarouselCard";
import HeroCopy from "./hero/HeroCopy";
import { AUTO_ROTATE_MS, DEFAULT_SERMON_IMAGE, FALLBACK_SLIDE, type SermonHeroSlide } from "./hero/types";

export type { SermonHeroSlide };

export type SermonHeroProps = {
  slides?: SermonHeroSlide[];
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  /** When provided, "Play message" opens the sermon inline instead of navigating. */
  onPlay?: (slug: string) => void;
};

export default function SermonHero({ slides = [], onPlay }: SermonHeroProps) {
  const { data: latestSermons } = useLatestSermons();
  const latestSlides = useMemo<SermonHeroSlide[]>(() => {
    return (
      latestSermons?.map((item) => ({
        title: item.title,
        speaker: item.speaker,
        scripture: item.scriptureRef ?? item.series ?? "Latest sermon",
        description:
          item.description ??
          (item.tags.length > 0 ? item.tags.join(" · ") : "A recent message from Everlasting Hills Church."),
        label: item.isFeatured ? "Featured" : item.series ?? "New Drop",
        image: item.thumbnailUrl ?? DEFAULT_SERMON_IMAGE,
        href: item.slug ? `/sermons/${item.slug}` : "/sermons",
        slug: item.slug,
        duration: item.audioDuration ? `${Math.ceil(item.audioDuration / 60)} min` : item.videoUrl ? "Video" : "Sermon",
        reactions: `${item.playCount} play${item.playCount === 1 ? "" : "s"}`,
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
    if (active >= safeSlides.length) setActive(0);
  }, [active, safeSlides.length]);

  useEffect(() => {
    if (paused || safeSlides.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % safeSlides.length);
    }, AUTO_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, safeSlides.length]);

  const slide = safeSlides[active] ?? safeSlides[0] ?? FALLBACK_SLIDE;

  const tickerItems = [slide.scripture, slide.speaker, slide.duration, slide.reactions, "Tap to listen"];

  return (
    <section
      className="relative overflow-hidden bg-[#060606] max-h-[80vh] text-white"
      aria-roledescription="carousel"
      aria-label="Sermon highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Single soft accent glow — not a full-image color wash */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-[480px] w-[480px] rounded-full bg-[#87102C]/25 blur-[130px]" />
        <div className="absolute inset-0 bg-grain opacity-[0.06] mix-blend-overlay" />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-4 pb-10 pt-24 sm:px-6 sm:pt-28 lg:px-10 lg:pb-12">
        <div className="mb-7">
          <StoryProgress count={safeSlides.length} active={active} paused={paused} onJump={setActive} />
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <HeroCopy slide={slide} onPlay={onPlay} />

          <SermonCarouselCard
            slides={safeSlides.length > 0 ? safeSlides : [FALLBACK_SLIDE]}
            active={active}
            onPlay={onPlay}
            onJump={setActive}
            className="h-[360px] sm:h-[400px] lg:h-[340px]"
          />
        </div>
      </div>

      <Marquee items={tickerItems} />
    </section>
  );
}
