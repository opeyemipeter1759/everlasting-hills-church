"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Play, Sparkles } from "lucide-react";
import { HERO_FALLBACK, type HeroContent } from "@/lib/site-settings";

export default function HeroSection({ content }: { content?: HeroContent }) {
  const c = content ?? HERO_FALLBACK;
  const rootRef = useRef<HTMLElement | null>(null);
  const words = c.headline.split(" ");

  return (
    <section
      id="hero"
      ref={rootRef}
      onMouseMove={(e) => {
        const el = rootRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
        const y = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
        el.style.setProperty("--mx", String(x));
        el.style.setProperty("--my", String(y));
      }}
      className="relative w-full min-h-[100vh] flex flex-col justify-center overflow-hidden pt-28 lg:pt-32 pb-10"
    >
      {/* Background — unchanged from original */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[60%] bg-church-maroon opacity-20 blur-[120px] rounded-full group-hover:opacity-30 transition-opacity duration-1000"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[50%] bg-[#4a0819] opacity-30 blur-[100px] rounded-full group-hover:opacity-40 transition-opacity duration-1000"></div>
        <div className="absolute inset-0 bg-grid-white" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center px-6 lg:px-12">
        {/* Badges */}
        <div
          style={{ animationDelay: "0ms" }}
          className="opacity-0 animate-fade-in flex flex-wrap items-center justify-center gap-3 mb-8"
        >
          {c.scriptureBadge.visible && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-church-maroon/30 border border-church-maroon/50 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-church-accent" />
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-black text-church-accent">
                {c.scriptureBadge.text}
              </span>
            </span>
          )}
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-church-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-church-accent" />
            </span>
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold text-white/70">
              Live every Sunday
            </span>
          </span>
        </div>

        {/* Headline block */}
        <div className="relative max-w-4xl mx-auto text-center">
          <svg
            viewBox="0 0 60 30"
            className="hidden lg:block absolute -left-16 top-2 w-10 h-5 text-white/25"
            fill="none"
          >
            <path d="M4 20 Q 20 4 56 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>

          <div className="hidden lg:flex flex-col items-center absolute -right-20 -top-8 text-white/35">
            <span
              style={{ fontFamily: "var(--font-dancing)" }}
              className="text-xl -rotate-6"
            >
              {c.mediaCard.eyebrow}
            </span>
            <svg viewBox="0 0 70 56" className="w-16 h-[52px] -mt-1 ml-10" fill="none">
              <path
                d="M10 8 C 32 4, 50 14, 42 32"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* <path
                d="M30 25 L 43 32 L 34 43"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              /> */}
            </svg>
          </div>

          {/* Headline is critical above-the-fold content — it renders and animates
              in via pure CSS (not Framer Motion's initial/animate) so it never sits
              invisible waiting on JS hydration behind an already-painted background.
              Each word carries its own staggered delay for a cascading reveal. */}
          <h1 className="text-[40px] sm:text-[64px] text-white lg:text-[76px] leading-[1.02] font-bold font-display tracking-tight mb-6">
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
              className="opacity-0 animate-fade-up inline-block"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-church-accent via-white to-church-maroon font-serif italic font-normal bg-[length:200%_100%] animate-gradient-x">
                {c.headlineAccent}
              </span>
            </span>
          </h1>

          <p
            style={{ animationDelay: "620ms" }}
            className="opacity-0 animate-fade-up text-white/60 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed font-sans font-medium"
          >
            {c.subtext}
          </p>
        </div>

        {/* Animated photo marquee */}
        <div
          style={{ animationDelay: "500ms" }}
          className="opacity-0 animate-fade-up w-[calc(100%+3rem)] lg:w-[calc(100%+6rem)] -mx-6 lg:-mx-12 mt-12 lg:mt-16"
        >
          <PhotoMarquee images={c.carouselImages} />
        </div>

        {/* CTAs */}
        <div
          style={{ animationDelay: "900ms" }}
          className="opacity-0 animate-fade-up flex flex-col sm:flex-row items-center gap-4 mt-10"
        >
          <div className="hidden lg:flex flex-col items-end justify-center pr-2 text-white/35 whitespace-nowrap">
            <span style={{ fontFamily: "var(--font-dancing)" }} className="text-xl rotate-3">
              Everyone&apos;s welcome
            </span>
            <svg viewBox="0 0 70 48" className="w-16 h-11 -mt-1 mr-2 scale-x-[-1]" fill="none">
              <path d="M8 8 C 30 4, 48 14, 40 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              {/* <path
                d="M28 25 L 41 32 L 32 43"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              /> */}
            </svg>
          </div>

          <motion.a
            href={c.ctaPrimary.href}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="group relative overflow-hidden px-10 py-4 bg-white text-church-dark font-bold rounded-xl transition-colors flex items-center justify-center gap-3 shadow-2xl shadow-white/10"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent w-1/2 animate-shine" />
            <span className="relative">{c.ctaPrimary.label}</span>
            <ArrowRight className="relative w-5 h-5 transition-transform group-hover:translate-x-1" />
          </motion.a>
          <motion.a
            href={c.ctaSecondary.href}
            whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.05)" }}
            whileTap={{ scale: 0.97 }}
            className="group px-10 py-4 bg-transparent border border-white/20 font-bold rounded-xl transition-all flex items-center justify-center gap-3 text-white"
          >
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center transition-transform group-hover:scale-110">
              <Play className="w-3 h-3 fill-white" />
            </div>
            {c.ctaSecondary.label}
          </motion.a>
        </div>

        <p
          style={{ animationDelay: "980ms" }}
          className="opacity-0 animate-fade-up text-[10px] uppercase tracking-[0.25em] text-white/35 font-bold mt-6"
        >
          {c.mediaCard.title} — {c.mediaCard.subtitle}
        </p>

        {/* Scroll cue */}
        <a
          href="#about"
          style={{ animationDelay: "1100ms" }}
          className="opacity-0 animate-fade-in hidden sm:flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors mt-10"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Scroll</span>
          <ChevronDown className="w-4 h-4 animate-bounce-soft" />
        </a>
      </div>
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
          const x = (((baseX - scrollRef.current) % totalWidth) + totalWidth) % totalWidth;
          const centerX = x + itemWidth / 2;
          const t = Math.min(1, Math.max(-1, (centerX - containerWidth / 2) / (containerWidth / 2)));
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
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      style={containerHeight ? { height: containerHeight } : undefined}
      className="relative w-full h-[240px] sm:h-[300px] lg:h-[360px] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
    >
      {loop.map((img, i) => (
        <div
          key={img + i}
          ref={(el) => { itemRefs.current[i] = el; }}
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
