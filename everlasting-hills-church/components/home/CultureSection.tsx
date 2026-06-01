"use client";

import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import { CULTURE_FALLBACK, type CultureContent } from "@/lib/site-settings";

/**
 * The 3-card identity (Word / Spirit / Community) is brand-fixed: icons,
 * pillar labels, inverted-middle visual treatment all live here. Content
 * (headline / body / verse) comes from site_settings via props with fallback.
 */
const PILLAR_IDENTITY = [
  {
    id: "word",
    label: "Word",
    icon: BookIcon,
    bg: "bg-[#FFF4F6]",
    border: "border-[#E7CDD3]",
    inverted: false,
  },
  {
    id: "spirit",
    label: "Spirit",
    icon: FlameIcon,
    bg: "bg-[#87102C]",
    border: "border-transparent",
    inverted: true,
  },
  {
    id: "community",
    label: "Community",
    icon: PeopleIcon,
    bg: "bg-[#FFF4F6]",
    border: "border-[#E7CDD3]",
    inverted: false,
  },
] as const;

export default function CultureSection({ content }: { content?: CultureContent }) {
  const c = content ?? CULTURE_FALLBACK;
  const cards = PILLAR_IDENTITY.map((identity, i) => ({
    ...identity,
    headline: c.cards[i].headline,
    body: c.cards[i].body,
    verse: c.cards[i].verseRef,
    verseText: c.cards[i].verseText,
  }));

  return (
    <section id="culture" className="py-24 w-full md:px-4  md:py-32 bg-white">
      <div className="px-8 mx-auto w-full max-w-[1400px] sm:px-8">
        <div className="mb-10">
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-full max-w-8 h-[1px] bg-[#87102C]/40" />
              <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold ">
                {c.label}
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-[#111] leading-[1.1] tracking-tight text-balance">
              {c.headline}
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="mt-4 text-[#555] text-base sm:text-lg leading-relaxed">
              {c.subtext}
            </p>
          </ScrollReveal>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          {cards.map((card, i) => (
            <ScrollReveal key={card.id} delay={0.1 + i * 0.12}>
              <CultureCard card={card} />
            </ScrollReveal>
          ))}
        </div>

        <p className="text-center text-[#999] text-xs mt-10 tracking-wide md:hidden">
          Tap a card to read the verse
        </p>
      </div>
    </section>
  );
}

type ResolvedCard = {
  id: string;
  label: string;
  icon: (props: { inverted?: boolean }) => React.ReactElement;
  bg: string;
  border: string;
  inverted: boolean;
  headline: string;
  body: string;
  verse: string;
  verseText: string;
};

function CultureCard({ card }: { card: ResolvedCard }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="group h-full [perspective:1600px]"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped((f) => !f)}
      role="button"
      tabIndex={0}
      aria-label={`${card.label}: ${card.headline}. Reveal verse ${card.verse}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
    >
      <div
        className="relative h-full min-h-[340px] w-full transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d]"
        style={{
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── FRONT ── */}
        <div
          className={`absolute inset-0 rounded-2xl border p-8 flex flex-col [backface-visibility:hidden] overflow-hidden ${card.bg} ${card.border} shadow-sm transition-shadow duration-300 group-hover:shadow-[0_24px_60px_-15px_rgba(135,16,44,0.35)]`}
        >
          {card.inverted && <DotPattern />}

          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
              card.inverted ? "bg-white/15" : "bg-[#87102C]/8"
            }`}
          >
            <card.icon inverted={card.inverted} />
          </div>

          <p
            className={`text-xs tracking-[0.2em] uppercase font-semibold mb-2 ${
              card.inverted ? "text-white/50" : "text-[#87102C]/60"
            }`}
          >
            {card.label}
          </p>

          <h3
            className={`text-xl font-bold mb-3 leading-tight ${
              card.inverted ? "text-white" : "text-[#111]"
            }`}
          >
            {card.headline}
          </h3>

          <p
            className={`text-sm leading-relaxed flex-1 ${
              card.inverted ? "text-white/70" : "text-[#555]"
            }`}
          >
            {card.body}
          </p>

          {/* Verse tag — now a hint that there's more */}
          <div
            className={`mt-6 inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              card.inverted
                ? "bg-white/15 text-white/70"
                : "bg-[#87102C]/8 text-[#87102C]"
            }`}
          >
            {card.verse}
            <ArrowIcon inverted={card.inverted} />
          </div>
        </div>

        {/* ── BACK ── */}
        <div
          className="absolute inset-0 rounded-2xl border border-transparent p-8 flex flex-col justify-center bg-[#87102C] [backface-visibility:hidden] overflow-hidden shadow-[0_24px_60px_-15px_rgba(135,16,44,0.45)]"
          style={{ transform: "rotateY(180deg)" }}
        >
          <DotPattern />

          {/* Big decorative quote mark */}
          <span className="absolute top-5 left-6 text-white/15 text-7xl font-serif leading-none select-none">
            &ldquo;
          </span>

          <blockquote className="relative text-white text-lg sm:text-[1.2rem] font-medium leading-relaxed [text-wrap:balance]">
            {card.verseText}
          </blockquote>

          <div className="relative mt-5 flex items-center gap-2">
            <span className="h-px w-6 bg-white/40" />
            <cite className="text-white/80 text-sm font-semibold not-italic tracking-wide">
              {card.verse}
            </cite>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared decorative dot pattern ──
function DotPattern() {
  return (
    <div
      className="absolute inset-0 opacity-[0.06] pointer-events-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='2' cy='2' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
      }}
    />
  );
}

function ArrowIcon({ inverted }: { inverted?: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      className="transition-transform duration-300 group-hover:translate-x-0.5"
      aria-hidden
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke={inverted ? "#fff" : "#87102C"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={inverted ? 0.7 : 0.6}
      />
    </svg>
  );
}

// Inline SVG icons
function BookIcon({ inverted }: { inverted?: boolean }) {
  const c = inverted ? "#fff" : "#87102C";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlameIcon({ inverted }: { inverted?: boolean }) {
  const c = inverted ? "#fff" : "#87102C";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8.5 14.5A5 5 0 0012 19c2.76 0 5-2.24 5-5 0-2.5-1.5-4.5-3.5-6-.5 2-2 3-3 3.5-.5-1-.5-2.5.5-4-2 1.5-2.5 3.5-2.5 5.5 0 .37.02.73.05 1.09" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 19c-1.5 0-2.5-1-2.5-2.5 0-2 2.5-3.5 2.5-3.5s2.5 1.5 2.5 3.5C14.5 18 13.5 19 12 19z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PeopleIcon({ inverted }: { inverted?: boolean }) {
  const c = inverted ? "#fff" : "#87102C";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}