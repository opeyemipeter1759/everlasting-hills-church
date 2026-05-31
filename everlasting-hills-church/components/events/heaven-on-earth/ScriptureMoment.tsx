import ScrollReveal from "@/components/home/ScrollReveal";
import { HEAVEN_ON_EARTH } from "./event-constants";

/**
 * Scripture moment — dramatic dark section. Full Dark Section Template from the
 * design system: deep burgundy gradient + noise texture + radial glow + mountain
 * silhouette divider at the bottom.
 *
 * Typography is the hero here: huge serif italic for the quote, centered, with
 * the reference set quietly below in tracking-wide uppercase.
 *
 * Pure CSS animations — no motion library needed for this section.
 */
export default function ScriptureMoment() {
  return (
    <section
      className="relative overflow-hidden py-32 md:py-44"
      style={{
        background:
          "linear-gradient(160deg, #2a0410 0%, #4a0819 30%, #87102C 70%, #a01535 100%)",
      }}
    >
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial spotlight behind the quote */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FFB3C1]/8 blur-[120px] rounded-full pointer-events-none" />

      {/* Mountain silhouette at bottom (acts as divider) */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-32 pointer-events-none"
        viewBox="0 0 1400 200"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M0 200 L0 130 L200 60 L420 100 L640 50 L860 90 L1080 55 L1280 95 L1400 70 L1400 200 Z"
          fill="white"
          opacity="0.04"
        />
        <path
          d="M0 200 L0 160 L240 110 L460 140 L680 100 L900 135 L1120 105 L1320 130 L1400 110 L1400 200 Z"
          fill="white"
          opacity="0.06"
        />
      </svg>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <ScrollReveal>
          <p className="text-[#FFB3C1] text-xs tracking-[0.4em] uppercase font-bold mb-8">
            Scripture
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <blockquote className="relative">
            {/* Open-quote glyph */}
            <span
              aria-hidden="true"
              className="absolute -top-12 left-1/2 -translate-x-1/2 text-[100px] text-white/20 font-serif leading-none select-none"
            >
              &ldquo;
            </span>
            <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-serif italic leading-[1.25] text-balance">
              Your kingdom come.
              <br className="hidden sm:block" /> Your will be done on earth as
              it is in heaven.
            </p>
          </blockquote>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="mt-12 inline-flex items-center gap-3">
            <span className="block w-8 h-px bg-[#FFB3C1]/60" />
            <p className="text-xs tracking-[0.4em] uppercase font-bold text-[#FFB3C1]">
              {HEAVEN_ON_EARTH.scripture.reference}
            </p>
            <span className="block w-8 h-px bg-[#FFB3C1]/60" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
