"use client";

import { Navigation, Youtube } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { CHURCH } from "../../config/config";

interface ServiceHeroProps {
  headingText: string;
  isLive: boolean;
  onGetDirections: () => void;
}

export default function ServiceHero({
  headingText,
  isLive,
  onGetDirections,
}: ServiceHeroProps) {
  return (
    <div>
          <ScrollReveal>
               <div className="flex items-center gap-3 mb-3">
            <span className="w-full max-w-8 h-[1px] bg-[#87102C]/40" />
        <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold ">
          Visit Us
                  </p>
                  </div>
      </ScrollReveal>

      {isLive && (
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-red-50 border border-red-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-red-600 text-xs font-semibold tracking-wide">
              We're Live Now
            </span>
          </div>
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.1}>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.08] tracking-tight mb-3 text-balance">
          {headingText}
        </h2>
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <p className="text-[#555] text-base sm:text-base leading-relaxed mb-3">
          Whether this is your first Sunday or your hundredth, you are welcome
          here. Come expecting to encounter the Word, the Spirit, and a family
          that genuinely cares.
        </p>
      </ScrollReveal>
  <ScrollReveal delay={0.45} direction="right">
        <div className="rounded-xl border border-dashed border-[#E7CDD3] bg-[#FFF4F6] p-6 flex items-start gap-4">
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#87102C] flex items-center justify-center">
            <span className="text-white text-lg leading-none">✦</span>
          </div>
          <div>
            <p className="text-[#111] font-semibold text-base mb-1">
              First time visiting?
            </p>
            <p className="text-[#666] text-sm leading-relaxed">
              We'd love to meet you. Come as you are  no dress code, no
              pressure. Just come expecting something real.
            </p>
          </div>
        </div>
      </ScrollReveal>
      <ScrollReveal delay={0.3}>
        <div className="flex flex-wrap gap-3 mt-2">
          <button
            onClick={onGetDirections}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
          >
            <Navigation size={15} />
            Get Directions
          </button>

          {isLive && (
            <a
              href={CHURCH.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              <Youtube size={15} />
              Watch Live
            </a>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
}