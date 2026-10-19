"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin, Play } from "lucide-react";
import { HERO_FALLBACK, type HeroContent } from "@/lib/site-settings";
import { SERVICES } from "@/config/config";
import HillRidge from "@/components/marketing/HillRidge";
import HeroWordNotes from "./HeroWordNotes";

function clock(h: number, m: number) {
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export default function HeroSection({ content }: { content?: HeroContent }) {
  const c = content ?? HERO_FALLBACK;
  const words = c.headline.split(" ");

  return (
    <section
      id="hero"
      className="relative w-full min-h-[100svh] flex flex-col justify-center overflow-hidden bg-church-dark pt-28 lg:pt-32 pb-20 sm:pb-28 lg:pb-36"
    >
      <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[55%] h-[65%] bg-church-maroon opacity-25 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[55%] bg-[#4a0819] opacity-40 blur-[110px] rounded-full" />
        <div className="absolute inset-0 bg-grid-white" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center px-4 xs:px-6 lg:px-12">
        {c.scriptureBadge.visible && (
          <p
            style={{ animationDelay: "0ms" }}
            className="opacity-0 animate-fade-in mb-7 flex items-center gap-2.5 text-sm text-church-accent"
          >
            <svg aria-hidden="true" viewBox="0 0 24 14" className="h-3 w-5" fill="none">
              <path d="M1 13 8 3l5 6 3-4 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {c.scriptureBadge.text}
          </p>
        )}

        <div className="relative max-w-4xl mx-auto text-center">
          {/* The headline is the first thing painted, so it animates in with pure
              CSS rather than waiting on hydration; each word has its own delay. */}
          <h1 className="font-serif font-normal text-[2.5rem] xs:text-5xl sm:text-7xl lg:text-[5.5rem] text-white leading-[1.03] tracking-tight text-balance mb-7">
            {words.map((word, i) => (
              <span
                key={`${word}-${i}`}
                style={{ animationDelay: `${80 + i * 70}ms` }}
                className="opacity-0 animate-fade-up inline-block mr-[0.22em]"
              >
                {word}
              </span>
            ))}
            <br />
            <span
              style={{ animationDelay: `${80 + words.length * 70 + 60}ms` }}
              className="opacity-0 animate-fade-up inline-block text-white/55"
            >
              {c.headlineAccent}
            </span>
          </h1>

          {/* Today's scripture and the Word of the Day sit either side of the
              intro as handwritten notes on wide screens, under it on smaller ones. */}
          <div className="relative max-w-2xl mx-auto">
            <p
              style={{ animationDelay: "620ms" }}
              className="opacity-0 animate-fade-up text-white/65 text-base xs:text-lg sm:text-xl leading-relaxed"
            >
              {c.subtext}
            </p>
            <HeroWordNotes placement="sides" />
          </div>
          <HeroWordNotes placement="inline" />
        </div>

        <div
          style={{ animationDelay: "800ms" }}
          className="opacity-0 animate-fade-up flex w-full sm:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-9"
        >
          <motion.a
            href={c.ctaPrimary.href}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="group relative overflow-hidden px-7 sm:px-9 py-3.5 bg-white text-church-dark font-semibold rounded-full flex items-center justify-center gap-3 shadow-2xl shadow-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-church-accent focus-visible:ring-offset-2 focus-visible:ring-offset-church-dark"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent w-1/2 animate-shine" />
            <span className="relative">{c.ctaPrimary.label}</span>
            <ArrowRight className="relative w-5 h-5 transition-transform group-hover:translate-x-1" />
          </motion.a>
          <motion.a
            href={c.ctaSecondary.href}
            whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.06)" }}
            whileTap={{ scale: 0.97 }}
            className="group px-7 sm:px-9 py-3.5 border border-white/25 font-semibold rounded-full flex items-center justify-center gap-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-church-accent focus-visible:ring-offset-2 focus-visible:ring-offset-church-dark"
          >
            <span className="w-6 h-6 shrink-0 rounded-full bg-white/10 flex items-center justify-center transition-transform group-hover:scale-110">
              <Play className="w-3 h-3 fill-white" />
            </span>
            {c.ctaSecondary.label}
          </motion.a>
        </div>

        {/* When and where — the first thing a new visitor needs. */}
        <Link
          href="/visit"
          style={{ animationDelay: "920ms" }}
          className="opacity-0 animate-fade-up mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-church-accent rounded"
        >
          <span className="inline-flex items-center gap-2">
            <Clock className="w-4 h-4 text-church-accent" aria-hidden="true" />
            Sundays {clock(SERVICES.sunday.startH, SERVICES.sunday.startM)}, Wednesdays {clock(SERVICES.wednesday.startH, SERVICES.wednesday.startM)}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin className="w-4 h-4 text-church-accent" aria-hidden="true" />
            Orogun, Ibadan
          </span>
        </Link>

        {/* Animated photo marquee */}
        <div
          style={{ animationDelay: "500ms" }}
          className="opacity-0 animate-fade-up w-[calc(100%+2rem)] xs:w-[calc(100%+3rem)] lg:w-[calc(100%+6rem)] -mx-4 xs:-mx-6 lg:-mx-12 mt-12 lg:mt-14"
        >
          <PhotoMarquee images={c.carouselImages} />
        </div>

        <p
          style={{ animationDelay: "1000ms" }}
          className="opacity-0 animate-fade-up text-sm text-white/45 mt-6 text-center"
        >
          {c.mediaCard.title}. {c.mediaCard.subtitle}
        </p>
      </div>

      <HillRidge fill="#ffffff" />
    </section>
  );
}

type MarqueeMetrics = {
  itemWidth: number;
  step: number;
  amplitude: number;
  totalWidth: number;
  containerWidth: number;
};

// Images ride an invisible arc across the strip — centered items dip down
// (edges ride higher), like the bottom half of a circle. The arc position is
// screen-relative, not list-index-relative, so it stays anchored to the
// viewport as the strip drifts right-to-left underneath it; that needs a
// per-frame transform instead of a plain CSS keyframe marquee.
function PhotoMarquee({ images }: { images: string[] }) {
  const loop = images.length ? [...images, ...images] : [];

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const metricsRef = useRef<MarqueeMetrics | null>(null);
  const scrollRef = useRef(0);
  const pausedRef = useRef(false);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!loop.length) return;
    const container = containerRef.current;
    if (!container) return;

    const SPEED = 42; // px/sec, matches the prior 32s CSS marquee pace

    const measure = () => {
      const firstItem = itemRefs.current[0];
      if (!firstItem) return;
      const rect = firstItem.getBoundingClientRect();
      const itemWidth = rect.width;
      const itemHeight = rect.height;
      const gap = Math.round(itemWidth * 0.1);
      const step = itemWidth + gap;
      const amplitude = itemHeight * 0.22;
      metricsRef.current = {
        itemWidth,
        step,
        amplitude,
        totalWidth: step * loop.length,
        containerWidth: container.clientWidth,
      };
      setContainerHeight(Math.ceil(itemHeight + amplitude + 8));
    };

    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!pausedRef.current) scrollRef.current += SPEED * dt;

      const m = metricsRef.current;
      if (m) {
        const { itemWidth, step, amplitude, totalWidth, containerWidth } = m;
        itemRefs.current.forEach((el, i) => {
          if (!el) return;
          const baseX = i * step;
          const x =
            (((baseX - scrollRef.current) % totalWidth) + totalWidth) %
            totalWidth;
          const centerX = x + itemWidth / 2;
          const t = Math.min(
            1,
            Math.max(-1, (centerX - containerWidth / 2) / (containerWidth / 2)),
          );
          const y = amplitude * (1 - t * t);
          el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        });
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [loop.length]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
      style={containerHeight ? { height: containerHeight } : undefined}
      className="relative w-full h-[240px] sm:h-[300px] lg:h-[360px] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
    >
      {loop.map((img, i) => (
        <div
          key={img + i}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          className="group/thumb absolute top-0 left-0 w-[140px] sm:w-[180px] lg:w-[215px] aspect-[3/4.3] rounded-[28px] overflow-hidden border border-white/10 bg-church-card shadow-xl will-change-transform"
        >
          <Image
            src={img}
            alt="Church Community"
            fill
            sizes="(max-width: 640px) 140px, 215px"
            className="object-cover grayscale-[0.15] transition-all duration-500 group-hover/thumb:grayscale-0 group-hover/thumb:scale-105"
            referrerPolicy="no-referrer"
            priority={i < 4}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-church-dark/40 to-transparent" />
        </div>
      ))}
    </div>
  );
}
