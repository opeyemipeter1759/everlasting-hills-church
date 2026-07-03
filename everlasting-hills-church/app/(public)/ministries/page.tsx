import ScrollReveal from "@/components/home/ScrollReveal";
import MinistriesCards from "@/components/ministries/MinistriesCards";

export const metadata = {
  title: "Ministries — Everlasting Hills Church",
  description:
    "Find your ministry group at Everlasting Hills Church — Men, Women, Teens, and Couples.",
};

export default function MinistriesPage() {
  return (
    <main>

      {/* ── HERO — dark, centered ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-church-dark text-white">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute right-[-10%] top-[-20%] h-[60%] w-[60%] rounded-full bg-[#87102C]/15 blur-[140px]" />
          <div className="absolute bottom-[-30%] left-[-10%] h-[50%] w-[50%] rounded-full bg-[#87102C]/10 blur-[120px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-5 pb-20 pt-36 text-center sm:px-8 sm:pt-44">
          <ScrollReveal>
            <p className="mb-5 text-[10px] font-black uppercase tracking-[0.4em] text-church-accent">
              Our Ministries
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Every season of life,{" "}
              <span className="bg-gradient-to-r from-[#e8768a] via-[#c93860] to-[#FFB3C1] bg-clip-text font-serif italic font-normal text-transparent">
                a place to belong
              </span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
              Our four ministry groups are shaped around where you are in life —
              so you always walk with people who truly understand your journey.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CARDS — light section ────────────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">

          {/* section label — "— LABEL" style matching CultureSection */}
          <div className="mb-10">
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-full max-w-8 h-[1px] bg-[#87102C]/40" />
                <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold">
                  Our Groups
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-[#111] leading-[1.1] tracking-tight text-balance">
                Four groups. One family.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="mt-4 text-[#555] text-base sm:text-lg leading-relaxed max-w-xl">
                Every person who walks through our doors belongs to one of these
                groups — hover a card to preview the scripture, click to explore.
              </p>
            </ScrollReveal>
          </div>

          {/* flip cards — client component */}
          <MinistriesCards />

          <p className="text-center text-[#999] text-xs mt-10 tracking-wide md:hidden">
            Tap a card to explore the ministry
          </p>
        </div>
      </section>

    </main>
  );
}
