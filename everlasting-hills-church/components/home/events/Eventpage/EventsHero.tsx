import { Sparkles } from "lucide-react";

export default function EventsHero() {
  return (
    <div className="relative overflow-hidden bg-[#0a0a0a] py-20 text-white md:py-28">
      <div className="pointer-events-none absolute -top-24 left-[-10%] h-96 w-96 rounded-full bg-[#87102C]/30 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-15%] right-[-10%] h-[28rem] w-[28rem] rounded-full bg-[#FFB3C1]/10 blur-[160px]" />
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-50 mix-blend-overlay" />

      <div className="relative mx-auto max-w-6xl px-5 text-center sm:px-8">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-[#FFB3C1]">
          <Sparkles size={13} />
          Everlasting Hills Church
        </span>
        <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl md:text-6xl">
          Gatherings &amp; Events
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
          Every service, revival, and reunion worth showing up for — browse what&apos;s coming
          next, or look back on where we&apos;ve been.
        </p>
      </div>
    </div>
  );
}
