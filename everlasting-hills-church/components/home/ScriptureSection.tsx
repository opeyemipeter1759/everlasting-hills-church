"use client";

import { useEffect, useState } from "react";
import ScrollReveal from "./ScrollReveal";
import { SCRIPTURE_FALLBACK, type ScriptureContent } from "@/lib/site-settings";

const PILLAR_SYMBOLS = ["01", "02", "03", "04"] as const;
const CYCLE_INTERVAL = 2200; // ms per card

export default function ScriptureSection({ content }: { content?: ScriptureContent }) {
  const c = content ?? SCRIPTURE_FALLBACK;
  const pillars = c.pillars.map((p, i) => ({ symbol: PILLAR_SYMBOLS[i], ...p }));
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % pillars.length);
    }, CYCLE_INTERVAL);
    return () => clearInterval(timer);
  }, [paused]);

  // When user hovers a card, pause cycling and highlight that card
  const handleMouseEnter = (i: number) => {
    setHoveredIndex(i);
    setActiveIndex(i);
    setPaused(true);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setPaused(false);
  };

  // "lit" = either manually hovered or auto-cycled active
  const isLit = (i: number) =>
    hoveredIndex !== null ? hoveredIndex === i : activeIndex === i;

  return (
    <section
      id="scripture"
      className="py-24 md:py-36 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #2a0410 0%, #4a0819 30%, #87102C 70%, #a01535 100%)",
      }}
    >
      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Large faint mountain */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 800 400"
          className="w-full max-w-4xl opacity-[0.04]"
          aria-hidden
        >
          <path d="M0,400 L200,100 L400,250 L600,80 L800,400 Z" fill="white" />
          <path d="M100,400 L400,50 L700,400 Z" fill="white" />
        </svg>
      </div>

      <style>{`
        .pillar-card {
          position: relative;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(6px);
          padding: 1.75rem 1.5rem;
          height: 100%;
          overflow: hidden;
          cursor: default;
          transition:
            border-color 0.5s ease,
            background 0.5s ease,
            transform 0.5s ease,
            box-shadow 0.5s ease;
        }

        /* Diagonal light sheen */
        .pillar-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.07) 0%,
            rgba(255, 255, 255, 0) 60%
          );
          opacity: 0;
          transition: opacity 0.5s ease;
        }

        .pillar-card.is-lit {
          border-color: rgba(255, 200, 130, 0.4);
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-6px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
        }

        .pillar-card.is-lit::before {
          opacity: 1;
        }

        /* Warm glow orb */
        .pillar-glow {
          position: absolute;
          top: -40px;
          right: -40px;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 155, 50, 0.28) 0%,
            transparent 70%
          );
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.5s ease;
        }

        .pillar-card.is-lit .pillar-glow {
          opacity: 1;
        }

        /* Bottom shimmer sweep */
        .pillar-shimmer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 200, 100, 0.7) 50%,
            transparent 100%
          );
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.55s ease;
        }

        .pillar-card.is-lit .pillar-shimmer {
          transform: scaleX(1);
        }

        /* Number */
        .pillar-num {
          display: block;
          font-size: 56px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -2px;
          color: rgba(255, 255, 255, 0.1);
          margin-bottom: 1.25rem;
          transition:
            color 0.5s ease,
            text-shadow 0.5s ease;
        }

        .pillar-card.is-lit .pillar-num {
          color: rgba(255, 210, 130, 0.85);
          text-shadow: 0 0 48px rgba(255, 165, 50, 0.4);
        }

        /* Accent line */
        .pillar-line {
          width: 22px;
          height: 2px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 2px;
          margin-bottom: 0.85rem;
          transition:
            width 0.5s ease,
            background 0.5s ease;
        }

        .pillar-card.is-lit .pillar-line {
          width: 44px;
          background: rgba(255, 200, 110, 0.7);
        }

        /* Phrase */
        .pillar-phrase {
          font-size: 15px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.35;
          margin-bottom: 0.65rem;
          transition: color 0.5s ease;
        }

        .pillar-card.is-lit .pillar-phrase {
          color: #ffffff;
        }

        /* Detail */
        .pillar-detail {
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.38);
          line-height: 1.7;
          transition: color 0.5s ease;
        }

        .pillar-card.is-lit .pillar-detail {
          color: rgba(255, 255, 255, 0.68);
        }

        /* Progress dots */
        .progress-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transition: background 0.4s ease, transform 0.4s ease;
        }

        .progress-dot.is-active {
          background: rgba(255, 200, 110, 0.85);
          transform: scale(1.4);
        }
      `}</style>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-10">
          <ScrollReveal>
            <p className="text-white/40 text-xs tracking-[0.25em] uppercase font-medium mb-4">
              {c.label}
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-2">
              {c.headline}
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="text-white/55 text-base sm:text-lg leading-relaxed">
              {c.subtext}
            </p>
          </ScrollReveal>
        </div>

        {/* Pillars grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((p, i) => (
            <ScrollReveal key={p.symbol} delay={0.1 + i * 0.1}>
              <div
                className={`pillar-card${isLit(i) ? " is-lit" : ""}`}
                onMouseEnter={() => handleMouseEnter(i)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="pillar-glow" />
                <div className="pillar-shimmer" />

                <span className="pillar-num">{p.symbol}</span>
                <div className="pillar-line" />
                <h3 className="pillar-phrase">{p.phrase}</h3>
                <p className="pillar-detail">{p.detail}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Scripture quote */}
        <ScrollReveal delay={0.3}>
          <div className="mt-12 text-center max-w-2xl mx-auto">
            <div
              className="inline-block px-6 py-5 rounded-2xl"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-white/40 text-sm italic leading-relaxed">
                &ldquo;{c.bottomQuote.text}&rdquo;
              </p>
              <p className="text-white/30 text-xs tracking-[0.15em] uppercase mt-2">
                {c.bottomQuote.reference}
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}