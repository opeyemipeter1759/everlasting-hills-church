"use client";

import { ArrowUpRight, GitBranch, Heart, Sprout } from "lucide-react";
import Link from "next/link";

/**
 * Footer-slab "Give" — "Branches over the wall" pattern.
 *
 * Voice + visual lean into EHC's Genesis 49 identity:
 *   - "Fruit by the well"      → local life
 *   - "Branches over the wall" → outreach beyond
 *   - "Blessings to the everlasting hills" → ancient/enduring impact
 *
 * Structure: split — left has the headline + three "fruit" impact tiles arranged
 * organically (not a uniform grid). Right has a compact "ways to give" panel
 * with one prominent CTA. No tabs, no account numbers — those live on /give.
 */
export default function GivingSection() {
  return (
    <section
      aria-labelledby="giving-heading"
      className="max-w-[1400px] mx-auto px-5 sm:px-8 mb-16"
    >
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#1a0610]/80 via-[#0e0407]/80 to-[#1a0610]/80 backdrop-blur-sm shadow-2xl">
        {/* Decorative glows + a stylized "vine" SVG behind */}
        <div className="absolute -top-32 -left-16 w-96 h-96 bg-[#87102C]/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -right-16 w-96 h-96 bg-amber-500/8 blur-3xl rounded-full pointer-events-none" />
        <VineMotif />

        <div className="relative grid lg:grid-cols-5 gap-8 lg:gap-12 p-8 sm:p-10 lg:p-12">
          {/* LEFT (3/5): headline + scripture-rooted impact tiles */}
          <div className="lg:col-span-3 flex flex-col">
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.3em] text-white/60 backdrop-blur-md">
              <Sprout size={12} className="text-[#e8768a]" />
              Sow into the hills
            </span>

            <h2
              id="giving-heading"
              className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-[1.05]"
            >
              Plant where{" "}
              <span className="bg-gradient-to-r from-[#e8768a] via-[#c93860] to-[#87102C] bg-clip-text text-transparent italic font-serif">
                you receive
              </span>
              .
            </h2>

            <p className="mt-4 max-w-xl text-white/65 leading-relaxed">
              Like a vine planted near water, every gift bears fruit — and the
              branches reach over the wall, into families, cities, and generations
              we may never meet.
            </p>

            {/* Impact tiles — non-uniform "branches" arrangement */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ImpactTile
                icon={<Sprout size={16} />}
                eyebrow="Fruit by the well"
                title="Local life"
                copy="Pastoral care, weekly worship, & a family that gathers."
              />
              <ImpactTile
                icon={<GitBranch size={16} />}
                eyebrow="Branches over the wall"
                title="Outreach"
                copy="Serving Ibadan and beyond — beyond ordinary limits."
                accent
              />
              <ImpactTile
                icon={<Heart size={16} />}
                eyebrow="Ancient & enduring"
                title="Generations"
                copy="Building a house that outlives a single season."
              />
            </div>
          </div>

          {/* RIGHT (2/5): How to give panel + CTA */}
          <aside className="lg:col-span-2 relative rounded-[20px] border border-white/8 bg-[#0a0306]/95 p-6 sm:p-7 shadow-inner">
            <div className="flex items-center justify-between mb-5">
              <p className="text-white/50 text-[10px] uppercase tracking-[0.3em] font-bold">
                Ways to give
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[9px] uppercase tracking-wider text-emerald-300 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Zero gateway fees
              </span>
            </div>

            <ul className="space-y-3">
              <GiveRow
                stepNumber="01"
                title="Bank transfer"
                description="Direct to ministry — no platform cut."
              />
              <GiveRow
                stepNumber="02"
                title="In-service offering"
                description="Bring your gift at Sunday or Wednesday gathering."
              />
              <GiveRow
                stepNumber="03"
                title="Designated giving"
                description="Building, outreach, or specific ministries."
              />
            </ul>

            <Link
              href="/give"
              className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white text-[#87102C] px-5 py-3.5 font-bold text-sm hover:bg-amber-50 hover:-translate-y-0.5 transition-all shadow-lg shadow-black/20"
            >
              See account details
              <ArrowUpRight
                size={14}
                className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </Link>

            <p className="mt-4 text-center text-[10px] uppercase tracking-[0.25em] text-white/30">
              Stewardship statements published yearly
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────

function ImpactTile({
  icon,
  eyebrow,
  title,
  copy,
  accent = false,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  copy: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 ${
        accent
          ? "border-[#87102C]/40 bg-gradient-to-br from-[#87102C]/15 to-[#87102C]/5"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
      }`}
    >
      <div
        className={`inline-flex w-9 h-9 rounded-xl items-center justify-center mb-3 ${
          accent ? "bg-white/15 text-white" : "bg-[#87102C]/20 text-[#e8768a]"
        }`}
      >
        {icon}
      </div>
      <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1">
        {eyebrow}
      </p>
      <p className="text-sm text-white font-bold mb-1.5">{title}</p>
      <p className="text-xs text-white/55 leading-relaxed">{copy}</p>
    </div>
  );
}

function GiveRow({
  stepNumber,
  title,
  description,
}: {
  stepNumber: string;
  title: string;
  description: string;
}) {
  return (
    <li className="flex items-start gap-3.5 rounded-xl border border-white/5 bg-white/[0.03] p-3.5 hover:bg-white/[0.06] hover:border-white/15 transition-colors">
      <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#87102C]/25 text-[#e8768a] flex items-center justify-center font-mono font-bold text-xs">
        {stepNumber}
      </span>
      <div className="min-w-0">
        <p className="text-sm text-white font-bold">{title}</p>
        <p className="text-xs text-white/55 leading-snug mt-0.5">{description}</p>
      </div>
    </li>
  );
}

/**
 * Stylized vine/branch SVG drawn faintly across the panel — visual echo of the
 * Genesis 49 imagery (vine, well, branches over the wall) without being literal.
 */
function VineMotif() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]"
      viewBox="0 0 1400 400"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Main vine */}
      <path
        d="M0 300 Q200 250 350 280 T700 260 T1050 240 T1400 220"
        stroke="white"
        strokeWidth="2"
        fill="none"
      />
      {/* Branches reaching up */}
      <path d="M250 280 Q260 220 280 200" stroke="white" strokeWidth="1.5" fill="none" />
      <path d="M520 270 Q540 200 570 170" stroke="white" strokeWidth="1.5" fill="none" />
      <path d="M830 250 Q860 180 890 150" stroke="white" strokeWidth="1.5" fill="none" />
      <path d="M1150 235 Q1180 165 1210 130" stroke="white" strokeWidth="1.5" fill="none" />
      {/* Fruit dots */}
      <circle cx="280" cy="200" r="4" fill="white" />
      <circle cx="570" cy="170" r="4" fill="white" />
      <circle cx="890" cy="150" r="4" fill="white" />
      <circle cx="1210" cy="130" r="4" fill="white" />
    </svg>
  );
}
