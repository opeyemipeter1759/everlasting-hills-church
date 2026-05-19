"use client";

import ScrollReveal from "./ScrollReveal";

// ── Scripture pillars — drawn from Genesis 49:22–26 ──
const pillars = [
  {
    symbol: "01",
    phrase: "Fruitful by the well",
    detail:
      "Like a vine planted near water, we are meant to bear fruit — abundant, overflowing, and lasting.",
  },
  {
    symbol: "02",
    phrase: "Branches over the wall",
    detail:
      "Our reach is beyond ordinary limits. Blessing flows outward — into families, cities, and generations.",
  },
  {
    symbol: "03",
    phrase: "Strengthened by the Mighty One",
    detail:
      "When the archers attack, it is God who steadies our arms. Our strength is not self-made.",
  },
  {
    symbol: "04",
    phrase: "Blessings to the everlasting hills",
    detail:
      "The promises on our lives are ancient, enduring, and greater than any mountain. They belong to eternity.",
  },
];

export default function ScriptureSection() {
  return (
    <section
      id="scripture"
      className="py-24 md:py-36 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #2a0410 0%, #4a0819 30%, #87102C 70%, #a01535 100%)",
      }}
    >
      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Large faint mountain */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 800 400"
          className="w-full max-w-4xl opacity-[0.04]"
          aria-hidden
        >
          <path d="M0,400 L200,100 L400,250 L600,80 L800,400 Z" fill="white" />
          <path d="M100,400 L400,50 L700,400 Z" fill="white" />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <ScrollReveal>
            <p className="text-white/40 text-xs tracking-[0.25em] uppercase font-medium mb-4">
              Our Identity
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-5">
              {/* ── Section heading — edit freely ── */}
              Rooted in a promise
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="text-white/55 text-base sm:text-lg leading-relaxed">
              Our name and calling come from Genesis 49:22–26 — a prophecy of
              fruitfulness, divine strength, and blessings that reach the
              everlasting hills.
            </p>
          </ScrollReveal>
        </div>

        {/* Pillars grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((p, i) => (
            <ScrollReveal key={p.symbol} delay={0.1 + i * 0.1}>
              <div className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 h-full group hover:bg-white/8 hover:border-white/20 transition-all duration-300">
                {/* Number */}
                <span className="text-white/15 text-5xl font-bold leading-none block mb-5">
                  {p.symbol}
                </span>
                {/* Phrase */}
                <h3 className="text-white text-lg font-semibold leading-snug mb-3">
                  {p.phrase}
                </h3>
                {/* Detail */}
                <p className="text-white/50 text-sm leading-relaxed">
                  {p.detail}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Scripture quote */}
        <ScrollReveal delay={0.3}>
          <div className="mt-14 text-center max-w-2xl mx-auto">
            <div className="inline-block">
              <p className="text-white/40 text-sm italic leading-relaxed">
                {/* ── Scripture reference ── */}
                &ldquo;The blessings of your father… are stronger than the
                blessings of the ancient mountains, than the bounty of the
                everlasting hills.&rdquo;
              </p>
              <p className="text-white/30 text-xs tracking-[0.15em] uppercase mt-2">
                Genesis 49:26
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
