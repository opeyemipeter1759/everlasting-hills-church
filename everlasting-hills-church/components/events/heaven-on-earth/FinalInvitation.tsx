import { ArrowUpRight } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";
import { HEAVEN_ON_EARTH } from "./event-constants";

/**
 * Final invitation — full-width burgundy-to-black closing CTA. Single dominant
 * headline + body + one large primary CTA. Sets the emotional last word.
 *
 * Pattern: Centered Hero (dark) with mountain divider at the bottom. Texture
 * overlay + radial spotlight. The CTA uses the "on dark" variant (white background,
 * burgundy text) to maximize contrast.
 */
export default function FinalInvitation() {
  return (
    <section
      className="relative overflow-hidden py-32 md:py-44"
      style={{
        background:
          "linear-gradient(180deg, #87102C 0%, #4a0819 50%, #2a0410 100%)",
      }}
    >
      {/* Texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-[#FFB3C1]/12 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center text-white">
        <ScrollReveal>
          <p className="text-[#FFB3C1] text-xs tracking-[0.4em] uppercase font-bold mb-6">
            One last thing
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-balance">
            Heaven is{" "}
            <em className="not-italic font-serif italic bg-gradient-to-r from-[#FFB3C1] via-[#FFE8ED] to-white bg-clip-text text-transparent">
              closer
            </em>{" "}
            than you think.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p className="mt-7 max-w-2xl mx-auto text-base sm:text-lg text-white/65 leading-relaxed">
            {HEAVEN_ON_EARTH.closingTagline}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="mt-12">
            <a
              href={HEAVEN_ON_EARTH.rsvpAnchor}
              className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-[#87102C] text-base font-bold hover:bg-[#FFE8ED] hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              Reserve My Seat
              <ArrowUpRight size={18} />
            </a>
            <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/40 font-semibold">
              {HEAVEN_ON_EARTH.dateDisplay} · {HEAVEN_ON_EARTH.venue.name}
            </p>
          </div>
        </ScrollReveal>
      </div>

      {/* Mountain silhouette divider at the very bottom */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-28 pointer-events-none"
        viewBox="0 0 1400 200"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M0 200 L0 130 L180 80 L350 110 L520 60 L700 95 L880 55 L1050 90 L1220 70 L1400 110 L1400 200 Z"
          fill="black"
          opacity="0.25"
        />
        <path
          d="M0 200 L0 165 L220 120 L420 150 L620 110 L820 140 L1020 105 L1210 135 L1400 120 L1400 200 Z"
          fill="black"
          opacity="0.4"
        />
      </svg>
    </section>
  );
}
