"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const MAROON = "#87102C";
const INTERVAL = 5500;

const photos = [
  { src: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1200&q=80", location: "Akobo · Ibadan", pillar: 1 },
  { src: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80", location: "Akobo · Ibadan", pillar: 2 },
  { src: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1200&q=80", location: "Akobo · Ibadan", pillar: 0 },
  { src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80", location: "Akobo · Ibadan", pillar: 1 },
  { src: "https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&w=1200&q=80", location: "Akobo · Ibadan", pillar: 2 },
];

export default function AboutSection() {
  return (
    <section id="about" className="pt-24 px-2 md:px-4 md:pt-32 bg-white overflow-hidden">
      <div className=" mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid md:grid-cols-2 gap-14 md:gap-20 items-center">
          {/* ── Left: animated gallery carousel ── */}
          <ScrollReveal direction="left">
            <GalleryCarousel />
          </ScrollReveal>
          <div>
            <ScrollReveal delay={0.1}>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-full max-w-8 h-[1px] bg-[#87102C]/40" />
                <p className="text-[#87102C] text-xs tracking-[0.25em] uppercase font-semibold">
                  Who We Are
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2} className="flex flex-col md:gap-5">
              <h2 className="text-3xl sm:text-4xl md:text-[3.25rem] font-bold text-[#111]  tracking-tight text-balance">
                Built on the Word.
              </h2>
                <span className="text-[#87102C] text-3xl sm:text-4xl md:text-[3.25rem] font-bold ">Alive in the Spirit.</span>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <p className="mt-6 text-[#3a3a3a] text-base leading-relaxed font-medium">
                We exist to help people genuinely encounter Christ  not as a
                distant doctrine, but as a living, present reality.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.4}>
              <p className="mt-4 text-[#3a3a3a] text-base leading-relaxed">
                The Word of God is the foundation beneath everything we do, and
                the Holy Spirit is our daily source of strength. We are a family
                committed to growing deeply in Scripture, living by the Spirit,
                and flourishing together. You don't just attend here  you
                belong here.
              </p>
            </ScrollReveal>

            {/* Pillars as inline editorial markers */}
            

            <ScrollReveal delay={0.6}>
              <div className="pt-8 flex flex-wrap gap-3">
                <a
                  href="#community"
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-all duration-200 hover:shadow-lg hover:shadow-[#87102C]/25 hover:-translate-y-0.5"
                >
                  Join the Family
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a
                  href="#culture"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-[#E7CDD3] text-[#87102C] text-sm font-semibold hover:bg-[#FFF4F6] transition-colors"
                >
                  Our Culture
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function GalleryCarousel() {
  const [[index, dir], setState] = useState<[number, number]>([0, 1]);
  const [paused, setPaused] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const active = ((index % photos.length) + photos.length) % photos.length;

  const paginate = useCallback((i: number, d: number) => setState([i, d]), []);
  const next = useCallback(() => setState(([i]) => [i + 1, 1]), []);
  const prev = useCallback(() => setState(([i]) => [i - 1, -1]), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setState(([i]) => [i + 1, 1]), INTERVAL);
    return () => clearInterval(t);
  }, [paused]);

  // keep active thumb centered
  useEffect(() => {
    const strip = stripRef.current;
    const el = strip?.children[active] as HTMLElement | undefined;
    if (strip && el) {
      strip.scrollTo({
        left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2,
        behavior: "smooth",
      });
    }
  }, [active]);

  const variants = {
    enter: (d: number) => ({ y: d > 0 ? "100%" : "-100%", opacity: 0.4, scale: 1.04 }),
    center: { y: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ y: d > 0 ? "-12%" : "12%", opacity: 0, scale: 1.02 }),
  };

  return (
    <div
      className="relative px-5 py-5  w-full mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Brackets />
      <EdgeLabels activePillar={photos[active].pillar} />

      <div
        className="relative rounded-xl overflow-hidden bg-[#3a0612] aspect-[16/12] group"
        role="region"
        aria-roledescription="carousel"
        aria-label="Life at our church"
      >
        {/* Vertical reveal */}
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={active}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              y: { type: "spring", stiffness: 260, damping: 30 },
              opacity: { duration: 0.45 },
              scale: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
            }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src={photos[active].src}
              alt={`Gallery photo ${active + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ scale: 1.12 }}
              animate={{ scale: 1 }}
              transition={{ duration: INTERVAL / 1000 + 1, ease: "linear" }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(58,6,18,0.05) 42%, rgba(58,6,18,0.9) 100%)" }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Counter */}
        <span className="absolute z-20 top-3.5 opacity-50 right-3.5 inline-flex items-center gap-1.5 bg-[#140509]/70 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-lg pointer-events-none">
          <CamIcon /> {String(active + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
        </span>

        {/* Location tag */}
        <AnimatePresence mode="wait">
          <motion.span
            key={`loc-${active}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.4 }}
            className="absolute z-20 left-3.5 bottom-[60px] inline-flex items-center gap-2 bg-[#140509]/55 backdrop-blur-sm text-white text-[11px] tracking-[0.12em] font-medium px-3.5 py-1.5 rounded-lg pointer-events-none uppercase"
          >
            <PinIcon /> {photos[active].location}
          </motion.span>
        </AnimatePresence>

        {/* Thumbnails inside the frame */}
        <div className="absolute z-20 inset-x-0 bottom-0 p-3 bg-gradient-to-t from-[#140509]/70 to-transparent">
          <div ref={stripRef} className="flex overflow-x-auto scroll-smooth" style={{ scrollbarWidth: "none" }}>
            {photos.map((p, i) => (
              <button
                key={p.src}
                onClick={() => paginate(i, i > active ? 1 : -1)}
                aria-label={`View photo ${i + 1}`}
                className="relative flex-[0_0_19%] min-w-0 aspect-[5/2]  overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt="" loading="lazy" className="w-full h-full object-cover transition-all duration-300" style={{ filter: i === active ? "none" : "brightness(0.5) saturate(0.8)" }} />
                {i === active && (
                  <motion.span
                    layoutId="thumb-ring"
                    className="absolute inset-0  pointer-events-none"
                    style={{ boxShadow: "inset 0 0 0 2px #FFE8ED" }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute z-20 bottom-0 inset-x-0 h-[2px] bg-white/15">
          <motion.div
            key={`bar-${active}-${paused}`}
            className="h-full"
            style={{ background: "#db9caa" }}
            initial={{ width: "0%" }}
            animate={{ width: paused ? "0%" : "100%" }}
            transition={{ duration: paused ? 0 : INTERVAL / 1000, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}

/* Word / Spirit / Family riding the frame edges — lights up to match the slide */
function EdgeLabels({ activePillar }: { activePillar: number }) {
  const base = "absolute z-30 text-[11px] font-medium uppercase select-none pointer-events-none";
  const spacing = { letterSpacing: "0.14em" as const };
  const tint = (on: boolean) => ({
    color: on ? MAROON : "rgba(135,16,44,0.3)",
    textShadow: on ? "0 0 12px rgba(135,16,44,0.35)" : "none",
  });
  return (
    <>
      <motion.span className={`${base} top-1 left-1/2`} style={{ ...spacing }}
        animate={{ ...tint(activePillar === 1), x: "-50%", scale: activePillar === 1 ? 1.1 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}>
        Spirit
      </motion.span>
      <motion.span className={`${base} left-0 top-1/2`} style={{ ...spacing, writingMode: "vertical-rl" }}
        animate={{ ...tint(activePillar === 0), y: "-50%", rotate: 180, scale: activePillar === 0 ? 1.1 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}>
        Word
      </motion.span>
      <motion.span className={`${base} right-0 top-1/2`} style={{ ...spacing, writingMode: "vertical-rl" }}
        animate={{ ...tint(activePillar === 2), y: "-50%", scale: activePillar === 2 ? 1.1 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}>
        Family
      </motion.span>
      <motion.span className={`${base} bottom-0 left-1/2`}
        animate={{ ...tint(activePillar === 1), x: "-50%", scale: activePillar === 1 ? 1.1 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}>
        Three pillars we live by
       </motion.span>
    </>
  );
}

function Brackets() {
  const base = "absolute w-7 h-7 pointer-events-none z-30 border-[#87102C]";
  return (
    <>
      <span className={`${base} top-1 left-1 border-t-2 border-l-2`} />
      <span className={`${base} top-1 right-1 border-t-2 border-r-2`} />
      <span className={`${base} bottom-1 left-1 border-b-2 border-l-2`} />
      <span className={`${base} bottom-1 right-1 border-b-2 border-r-2`} />
    </>
  );
}
function CamIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" /></svg>;
}
function PinIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#FFB3C4" strokeWidth="2" strokeLinejoin="round" /><circle cx="12" cy="10" r="3" stroke="#FFB3C4" strokeWidth="2" /></svg>;
}
function Chevron({ dir }: { dir: "left" | "right" }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden><path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}