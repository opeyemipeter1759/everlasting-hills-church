"use client";
import {  useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { HERO_FALLBACK, type HeroContent } from "@/lib/site-settings";

export default function HeroSection({ content }: { content?: HeroContent }) {
  const c = content ?? HERO_FALLBACK;
  const rootRef = useRef<HTMLElement | null>(null);

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
      className="relative flex-1  flex flex-col  h-[100vh] justify-center overflow-hidden pt-24 lg:pt-28"
    >
        <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[60%] bg-church-maroon opacity-20 blur-[120px] rounded-full group-hover:opacity-30 transition-opacity duration-1000"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[50%] bg-[#4a0819] opacity-30 blur-[100px] rounded-full group-hover:opacity-40 transition-opacity duration-1000"></div>
        <div className="absolute inset-0 bg-grid-white" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto  w-full px-6 lg:px-12 py-12 lg:py-0">
        <div className="grid grid-cols-1 md:grid-cols-12 lg:gap-8 items-center mb-20">
          {/* Left Content */}
          <div className="md:col-span-12 lg:col-span-7 flex flex-col items-start justify-center  text-left mb-16 lg:mb-0">
            {c.scriptureBadge.visible && (
              <div
                style={{ animationDelay: "0ms" }}
                className="opacity-0 animate-fade-in inline-flex items-center gap-2 px-3 py-1 rounded-full bg-church-maroon/30 border border-church-maroon/50 mb-4"
              >
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-black text-church-accent">
                  {c.scriptureBadge.text}
                </span>
              </div>
            )}

            {/* Headline is critical above-the-fold content — it renders and animates
                in via pure CSS (not Framer Motion's initial/animate) so it never sits
                invisible waiting on JS hydration behind an already-painted background. */}
            <h1
              style={{ animationDelay: "80ms" }}
              className="opacity-0 animate-fade-up text-[48px] sm:text-[64px] text-white lg:text-[84px] leading-[0.95] font-bold font-display tracking-tight mb-5"
            >
              {c.headline} <br/>
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-church-accent to-church-maroon font-serif italic font-normal bg-[length:200%_100%] animate-gradient-x"
              >
                {c.headlineAccent}
              </span>
            </h1>

            <p
              style={{ animationDelay: "160ms" }}
              className="opacity-0 animate-fade-up text-white/60 text-lg sm:text-xl max-w-xl leading-relaxed mb-5 font-sans font-medium"
            >
              {c.subtext}
            </p>

            <div
              style={{ animationDelay: "240ms" }}
              className="opacity-0 animate-fade-up flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <motion.a
                href={c.ctaPrimary.href}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-4 bg-white text-church-dark font-bold rounded-xl hover:bg-church-warm transition-all flex items-center justify-center gap-3 shadow-2xl shadow-white/10"
              >
                {c.ctaPrimary.label}
                <ArrowRight className="w-5 h-5" />
              </motion.a>
              <motion.a
                href={c.ctaSecondary.href}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-4 bg-transparent border border-white/20 font-bold rounded-xl transition-all flex items-center justify-center gap-3 text-white"
              >
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <Play className="w-3 h-3 fill-white" />
                </div>
                {c.ctaSecondary.label}
              </motion.a>
            </div>
          </div>

          {/* Right Visual (Interactive Media) */}
          <div className="md:col-span-12 lg:col-span-5 relative   flex items-center justify-center">
            <div className="relative w-full aspect-[3.5/5] md:aspect-[4.7/5] max-w-xl bg-church-card rounded-[40px] border border-white/10 p-6 shadow-2xl overflow-hidden group transition-all duration-500 hover:border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-church-maroon/20 to-transparent pointer-events-none"></div>
              
              {/* Photo Fan Integration - Scaled and Positioned */}
              <div className="absolute  inset-0 z-10 flex items-center justify-center scale-[1] lg:scale-[1] translate-y-[-10%] sm:translate-y-0">
                <ParticleCanvas />
                <div
                  className="relative z-10 w-full h-full flex items-center justify-center"
                  style={{
                    transform: "translate3d(calc(var(--mx, 0) * 18px), calc(var(--my, 0) * 8px), 0)",
                    transition: "transform 0.08s linear",
                  }}
                >
                  <PhotoFan images={c.carouselImages} />
                </div>
              </div>

              {/* Decorative Graphics (Design Elements from HTML) */}
              <div className="relative h-full flex  flex-col justify-between z-20 pointer-events-none">
                <div className="space-y-4">
                  <div className="h-1.5 w-16 bg-church-accent rounded-full transition-all group-hover:w-24"></div>
                  <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-bold">{c.mediaCard.eyebrow}</p>
                </div>

                <div className="flex flex-col md:mb-0 mb-16 gap-4">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl"
                  >
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-church-accent">
                        <Play className="w-5 h-5 fill-church-accent" />
                      </div>
                      <span className="font-bold text-white tracking-tight text-sm">{c.mediaCard.title}</span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed uppercase tracking-wider font-semibold">
                      {c.mediaCard.subtitle}
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Mountain Illustration (Design element from HTML) */}
              <div className="absolute bottom-[-10px] left-0 w-full pointer-events-none">
                <svg viewBox="0 0 400 150" className="w-full opacity-10 transition-opacity group-hover:opacity-20">
                  <path d="M0 150 L80 60 L140 100 L240 20 L320 90 L400 40 L400 150 Z" fill="white" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function PhotoFan({ images }: { images: string[] }) {
  return (
    <div className="relative w-full max-w-xl h-full flex justify-center items-center">
      {images.map((img, i) => {
        const rotationRange = 8;
        const rotation = (i - (images.length - 1) / 2) * rotationRange;
        const xOffset = `calc(${(i - (images.length - 1) / 2)} * 68px)`;
        const zIndex = i === Math.floor(images.length / 2) ? 20 : 10;

        return (
          <motion.div
            key={img}
            initial={{ opacity: 0, scale: 0.7, y: 40, rotate: rotation * 0.5 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              rotate: rotation,
              x: xOffset,
              zIndex,
            }}
            whileHover={{
              zIndex: 50,
              y: -20,
              scale: 1.05,
              rotate: rotation * 0.5,
              transition: { duration: 0.25 },
            }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 16,
              delay: 0.35 + i * 0.12,
            }}
            style={{ zIndex }}
            className="absolute mt-16 md:mt-0 rounded-2xl p-1.5 sm:p-2 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden cursor-pointer w-[160px] h-[250px] sm:w-[200px] sm:h-[260px] lg:w-[240px] lg:h-[280px]"
          >
            <div className="relative w-full h-full rounded-xl overflow-hidden group/image">
              <Image
                src={img}
                alt="Church Community"
                fill
                sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 240px"
                className="object-cover grayscale-[0.2] group-hover/image:grayscale-0 transition-all duration-500"
                referrerPolicy="no-referrer"
                priority={zIndex === 20}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-church-dark/40 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function ParticleCanvas({
  density = 1,
  speed = 1,
  className = "",
}: {
  density?: number;
  speed?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas as HTMLCanvasElement;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const context = ctx as CanvasRenderingContext2D;

    let particles: Array<{ x: number; y: number; r: number; vx: number; vy: number; a: number }> = [];
    const DPR = window.devicePixelRatio || 1;

    function resize() {
      c.width = Math.max(300, c.clientWidth) * DPR;
      c.height = Math.max(300, c.clientHeight) * DPR;
      context.scale(DPR, DPR);
    }

    function init() {
      particles = [];
      const divisor = Math.max(2000, 8000 / Math.max(0.1, density));
      const count = Math.round((c.clientWidth * c.clientHeight) / divisor);
      for (let i = 0; i < Math.max(8, count); i++) {
        particles.push({
          x: Math.random() * c.clientWidth,
          y: Math.random() * c.clientHeight,
          r: 0.5 + Math.random() * (1.8 * Math.max(0.5, density)),
          vx: (Math.random() - 0.5) * 0.15 * Math.max(0.25, speed),
          vy: (-0.02 - Math.random() * 0.18) * Math.max(0.35, speed),
          a: 0.04 + Math.random() * 0.12 * Math.max(0.5, density),
        });
      }
    }

    let raf = 0;

    function draw() {
      if (!context) return;
      context.clearRect(0, 0, c.width, c.height);
      context.save();
      context.globalCompositeOperation = "lighter";
      for (const p of particles) {
        context.beginPath();
        context.fillStyle = `rgba(255,255,255,${p.a})`;
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }

    function step() {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) p.y = c.clientHeight + 10;
        if (p.x < -10) p.x = c.clientWidth + 10;
        if (p.x > c.clientWidth + 10) p.x = -10;
      }
      draw();
      raf = requestAnimationFrame(step);
    }

    resize();
    init();
    raf = requestAnimationFrame(step);

    const onResize = () => {
      resize();
      init();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className={"absolute inset-0 w-full h-full z-0 pointer-events-none " + className} />;
}

