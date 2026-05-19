"use client";

import ScrollReveal from "./ScrollReveal";

export default function AboutSection() {
  return (
    <section id="about" className="py-24 md:py-32 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid md:grid-cols-2 gap-14 md:gap-20 items-center">
          {/* Left: Visual block */}
          <ScrollReveal direction="left">
            <div className="relative">
              {/* Large decorative block */}
              <div
                className="relative rounded-2xl overflow-hidden aspect-[4/5] max-w-[460px]"
                style={{
                  background:
                    "linear-gradient(135deg, #87102C 0%, #4a0819 100%)",
                }}
              >
                {/* Pattern overlay */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />

                {/* Centered content inside the block */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
                  {/* Mountain icon */}
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 80 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mb-6 opacity-40"
                    aria-hidden="true"
                  >
                    <path d="M8 64L40 16L72 64H8Z" fill="white" opacity="0.2" />
                    <path
                      d="M20 64L40 28L60 64H20Z"
                      fill="white"
                      opacity="0.4"
                    />
                    <path
                      d="M30 64L40 42L50 64H30Z"
                      fill="white"
                      opacity="0.9"
                    />
                  </svg>
                  <p className="text-white/50 text-xs tracking-[0.2em] uppercase mb-3">
                    Est. in faith
                  </p>
                  <p className="text-white text-2xl font-bold leading-snug">
                    Everlasting
                    <br />
                    Hills Church
                  </p>
                  <p className="text-white/50 text-sm mt-4">Ibadan, Nigeria</p>
                </div>

                {/* Bottom accent strip */}
                <div className="absolute bottom-0 inset-x-0 h-1 bg-[#FFE8ED] opacity-30" />
              </div>

              {/* Floating stat card */}
              <div className="absolute -bottom-5 -right-5 md:-right-8 bg-white rounded-xl shadow-[0_8px_40px_rgba(135,16,44,0.12)] border border-brand-rose/40 p-5 w-44">
                <p className="text-[#87102C] font-bold text-3xl leading-none mb-1">
                  Word
                </p>
                <p className="text-[#87102C] font-bold text-3xl leading-none mb-1">
                  Spirit
                </p>
                <p className="text-[#87102C] font-bold text-3xl leading-none">
                  Family
                </p>
                <div className="mt-3 h-px bg-brand-rose" />
                <p className="text-[#666] text-xs mt-2">
                  Three pillars we live by
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Right: Text content */}
          <div className="space-y-6">
            <ScrollReveal delay={0.1}>
              <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold">
                Who We Are
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.1] tracking-tight text-balance">
                {/* ── About heading — edit freely ── */}
                Built on the Word.
                <br />
                <span className="text-[#87102C]">Alive in the Spirit.</span>
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <p className="text-[#444] text-base sm:text-lg leading-relaxed">
                {/*
                  ── About paragraph 1 — edit freely ──
                  Keep it warm, clear, and biblical.
                */}
                Everlasting Hills Church exists to help people genuinely
                encounter Christ — not just as a doctrine, but as a living
                reality. We believe the Word of God is the foundation of
                everything, and that the Holy Spirit is our daily source of
                strength.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.4}>
              <p className="text-[#444] text-base sm:text-lg leading-relaxed">
                {/* ── About paragraph 2 — edit freely ── */}
                We are a community of people committed to growing deeply in
                Scripture, living by the Spirit, and flourishing together as a
                family. You don't just attend here — you belong here.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.5}>
              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href="#community"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-all duration-200 hover:shadow-lg hover:shadow-burgundy/20 hover:-translate-y-0.5"
                >
                  Join the Family
                </a>
                <a
                  href="#culture"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#E7CDD3] text-[#87102C] text-sm font-semibold hover:bg-[#FFF4F6] transition-colors"
                >
                  Our Culture
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
