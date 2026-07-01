"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Heart, Zap, Users } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";

export const MINISTRIES = [
  {
    slug: "mens",
    icon: Crown,
    name: "Men's Ministry",
    body: "A community where men grow in faith, character, and godly leadership — sharpening one another for family, work, and purpose.",
    verseRef: "Prov 27:17",
    verseText: "Iron sharpens iron, and one man sharpens another.",
    inverted: false,
  },
  {
    slug: "womens",
    icon: Heart,
    name: "Women's Ministry",
    body: "A space where women are celebrated, equipped, and rooted in God's word — building each other up in grace and truth.",
    verseRef: "Prov 31:25",
    verseText: "She is clothed with strength and dignity; she can laugh at the days to come.",
    inverted: true,
  },
  {
    slug: "teens",
    icon: Zap,
    name: "Teen's Ministry",
    body: "A movement for the next generation — where teenagers encounter God, own their faith, and discover who He made them to be.",
    verseRef: "1 Tim 4:12",
    verseText: "Don't let anyone look down on you because you are young, but set an example in speech, in conduct, in love, in faith and in purity.",
    inverted: false,
  },
  {
    slug: "couples",
    icon: Users,
    name: "Couple's Ministry",
    body: "Strengthening marriages through the word, community, and intentional moments that remind couples why they chose each other.",
    verseRef: "Eccl 4:9",
    verseText: "Two are better than one, because they have a good return for their labour — for if either of them falls, one can help the other up.",
    inverted: false,
  },
];

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

type Ministry = typeof MINISTRIES[number];

function MinistryCard({ m }: { m: Ministry }) {
  const [flipped, setFlipped] = useState(false);
  const Icon = m.icon;

  return (
    <Link
      href={`/ministries/${m.slug}`}
      className="group block h-full [perspective:1600px] outline-none focus-visible:ring-2 focus-visible:ring-[#87102C] focus-visible:ring-offset-2 rounded-2xl"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div
        className="relative h-full min-h-[320px] w-full transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d]"
        style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* ── FRONT ── */}
        <div
          className={`absolute inset-0 rounded-2xl border p-8 flex flex-col [backface-visibility:hidden] overflow-hidden shadow-sm transition-shadow duration-300 group-hover:shadow-[0_24px_60px_-15px_rgba(135,16,44,0.35)] ${
            m.inverted
              ? "bg-[#87102C] border-transparent"
              : "bg-[#FFF4F6] border-[#E7CDD3]"
          }`}
        >
          {m.inverted && <DotPattern />}

          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
              m.inverted ? "bg-white/15" : "bg-[#87102C]/8"
            }`}
          >
            <Icon size={22} strokeWidth={1.8} className={m.inverted ? "text-white" : "text-[#87102C]"} />
          </div>

          <h3 className={`text-xl font-bold mb-3 leading-tight ${m.inverted ? "text-white" : "text-[#111]"}`}>
            {m.name}
          </h3>

          <p className={`text-sm leading-relaxed flex-1 ${m.inverted ? "text-white/70" : "text-[#555]"}`}>
            {m.body}
          </p>

          <div className={`mt-6 inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            m.inverted ? "bg-white/15 text-white/70" : "bg-[#87102C]/8 text-[#87102C]"
          }`}>
            {m.verseRef}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" stroke={m.inverted ? "#fff" : "#87102C"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={m.inverted ? 0.7 : 0.6} />
            </svg>
          </div>
        </div>

        {/* ── BACK — always burgundy ── */}
        <div
          className="absolute inset-0 rounded-2xl border border-transparent p-8 flex flex-col justify-center bg-[#87102C] [backface-visibility:hidden] overflow-hidden shadow-[0_24px_60px_-15px_rgba(135,16,44,0.45)]"
          style={{ transform: "rotateY(180deg)" }}
        >
          <DotPattern />
          <span className="absolute top-5 left-6 text-white/15 text-7xl font-serif leading-none select-none">&ldquo;</span>
          <blockquote className="relative text-white text-lg sm:text-[1.2rem] font-medium leading-relaxed [text-wrap:balance]">
            {m.verseText}
          </blockquote>
          <div className="relative mt-5 flex items-center gap-2">
            <span className="h-px w-6 bg-white/40" />
            <cite className="text-white/80 text-sm font-semibold not-italic tracking-wide">{m.verseRef}</cite>
          </div>
          <p className="relative mt-6 text-xs text-white/40 font-medium">Click to learn more →</p>
        </div>
      </div>
    </Link>
  );
}

export default function MinistriesCards() {
  return (
    <div className="grid sm:grid-cols-2 gap-5 md:gap-6">
      {MINISTRIES.map((m, i) => (
        <ScrollReveal key={m.name} delay={0.1 + i * 0.12}>
          <MinistryCard m={m} />
        </ScrollReveal>
      ))}
    </div>
  );
}
