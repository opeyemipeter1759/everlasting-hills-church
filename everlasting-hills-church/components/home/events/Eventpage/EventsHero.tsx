import Image from "next/image";
import { Sparkles } from "lucide-react";

export interface EventsHeroProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  backgroundImage?: string | null;
}

export default function EventsHero({
  eyebrow = "Everlasting Hills Church",
  title = "Gatherings & Events",
  subtitle = "Every service, revival, and reunion worth showing up for — browse what's coming next, or look back on where we've been.",
  backgroundImage,
}: EventsHeroProps) {
  return (
    <div className="relative overflow-hidden bg-[#0a0a0a] py-20 text-white md:py-28">
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image src={backgroundImage} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/65 to-[#0a0a0a]/95" />
        </div>
      )}
      <div className="pointer-events-none absolute -top-24 left-[-10%] h-96 w-96 rounded-full bg-[#87102C]/30 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-15%] right-[-10%] h-[28rem] w-[28rem] rounded-full bg-[#FFB3C1]/10 blur-[160px]" />
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-50 mix-blend-overlay" />

      <div className="relative mx-auto max-w-6xl px-5 text-center sm:px-8">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-[#FFB3C1]">
          <Sparkles size={13} />
          {eyebrow}
        </span>
        <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl md:text-6xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
