"use client";
import ScrollReveal from "./ScrollReveal";
import EhcSlider, { EhcImage } from "../../ui/EHCSlider";
import { ABOUT_FALLBACK, type AboutContent } from "@/lib/site-settings";





export default function AboutSection({ content }: { content?: AboutContent }) {
  const c = content ?? ABOUT_FALLBACK;
  const sliderImages: EhcImage[] = c.gallery.map((g) => ({ name: g.name, src: g.src }));
  return (
    <section id="about" className="pt-24 px-2 md:px-4 md:pt-32 bg-white overflow-hidden">
      <div className=" mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid md:grid-cols-2 gap-14 md:gap-20 items-center">
          {/* ── Left: animated gallery carousel ── */}
          <ScrollReveal direction="left">
            <EhcSlider images={sliderImages} word="EHC" />
          </ScrollReveal>
          <div>
            <ScrollReveal delay={0.1}>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-full max-w-8 h-[1px] bg-[#87102C]/40" />
                <p className="text-[#87102C] text-xs tracking-[0.25em] uppercase font-semibold">
                  {c.label}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2} className="flex flex-col md:gap-5">
              <h2 className="text-3xl sm:text-4xl md:text-[3.25rem] font-bold text-[#111]  tracking-tight text-balance">
                {c.headline}
              </h2>
              <span className="text-[#87102C] text-3xl sm:text-4xl md:text-[3.25rem] font-bold ">
                {c.headlineAccent}
              </span>
            </ScrollReveal>

            {c.paragraphs.map((para, i) => (
              <ScrollReveal key={i} delay={0.3 + i * 0.1}>
                <p
                  className={
                    i === 0
                      ? "mt-6 text-[#3a3a3a] text-base leading-relaxed font-medium"
                      : "mt-4 text-[#3a3a3a] text-base leading-relaxed"
                  }
                >
                  {para}
                </p>
              </ScrollReveal>
            ))}

            <ScrollReveal delay={0.6}>
              <div className="pt-8 flex flex-wrap gap-3">
                <a
                  href={c.ctaPrimary.href}
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-all duration-200 hover:shadow-lg hover:shadow-[#87102C]/25 hover:-translate-y-0.5"
                >
                  {c.ctaPrimary.label}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a
                  href={c.ctaSecondary.href}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-[#E7CDD3] text-[#87102C] text-sm font-semibold hover:bg-[#FFF4F6] transition-colors"
                >
                  {c.ctaSecondary.label}
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}

