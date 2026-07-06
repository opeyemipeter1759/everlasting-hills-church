import ScrollReveal from "@/components/home/ScrollReveal";
import MinistriesCards, { type MinistryGroup, MINISTRIES } from "@/components/ministries/MinistriesCards";
import GroupFinder from "@/components/ministries/GroupFinder";
import { getStructuredContent } from "@/lib/cms-page";

export const metadata = {
  title: "Ministries — Everlasting Hills Church",
  description:
    "Find your ministry group at Everlasting Hills Church — Men, Women, Teens, and Couples.",
};

interface MinistriesContent {
  eyebrow: string;
  title: string;
  accent: string;
  lead: string;
  sectionLabel: string;
  sectionHeading: string;
  sectionLead: string;
  groups: MinistryGroup[];
}

const FALLBACK: MinistriesContent = {
  eyebrow: "Our Ministries",
  title: "Every season of life,",
  accent: "a place to belong",
  lead: "Our four ministry groups are shaped around where you are in life — so you always walk with people who truly understand your journey.",
  sectionLabel: "Our Groups",
  sectionHeading: "Four groups. One family.",
  sectionLead: "Every person who walks through our doors belongs to one of these groups — hover a card to preview the scripture, click to explore.",
  groups: MINISTRIES,
};

function isValid(c: unknown): c is MinistriesContent {
  const v = c as MinistriesContent;
  return Boolean(v && v.title && Array.isArray(v.groups) && v.groups.length > 0);
}

export default async function MinistriesPage({ searchParams }: { searchParams: { preview?: string } }) {
  const c = await getStructuredContent("ministries", {
    preview: searchParams.preview,
    fallback: FALLBACK,
    valid: isValid,
  });

  return (
    <main>
      {searchParams.preview && (
        <div className="bg-[#87102C] text-white text-center text-xs font-semibold py-2 tracking-wide">
          PREVIEW — draft, not published
        </div>
      )}

      {/* ── HERO — dark, centered ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-church-dark text-white">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute right-[-10%] top-[-20%] h-[60%] w-[60%] rounded-full bg-[#87102C]/15 blur-[140px]" />
          <div className="absolute bottom-[-30%] left-[-10%] h-[50%] w-[50%] rounded-full bg-[#87102C]/10 blur-[120px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-5 pb-20 pt-36 text-center sm:px-8 sm:pt-44">
          <ScrollReveal>
            <p className="mb-5 text-[10px] font-black uppercase tracking-[0.4em] text-church-accent">
              {c.eyebrow}
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {c.title}{" "}
              <span className="bg-gradient-to-r from-[#e8768a] via-[#c93860] to-[#FFB3C1] bg-clip-text font-serif italic font-normal text-transparent">
                {c.accent}
              </span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
              {c.lead}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CARDS — light section ────────────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="mb-10">
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-full max-w-8 h-[1px] bg-[#87102C]/40" />
                <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold">
                  {c.sectionLabel}
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-[#111] leading-[1.1] tracking-tight text-balance">
                {c.sectionHeading}
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="mt-4 text-[#555] text-base sm:text-lg leading-relaxed max-w-xl">
                {c.sectionLead}
              </p>
            </ScrollReveal>
          </div>

          <MinistriesCards groups={c.groups} />

          <p className="text-center text-[#999] text-xs mt-10 tracking-wide md:hidden">
            Tap a card to explore the ministry
          </p>
        </div>
      </section>

      {/* ── GROUP FINDER — dark section ──────────────────────────────────── */}
      <section className="relative overflow-hidden bg-church-dark py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-[-10%] top-[-20%] h-[55%] w-[55%] rounded-full bg-[#87102C]/12 blur-[130px]" />
          <div className="absolute bottom-[-20%] right-[-10%] h-[50%] w-[50%] rounded-full bg-[#87102C]/10 blur-[120px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* left — copy */}
            <div>
              <ScrollReveal>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#FFB3C1]/60 mb-4">
                  Stay Connected
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <h2 className="text-3xl sm:text-4xl md:text-[2.6rem] font-bold leading-[1.1] tracking-tight text-white text-balance">
                  Join your{" "}
                  <span className="bg-gradient-to-r from-[#e8768a] via-[#c93860] to-[#FFB3C1] bg-clip-text font-serif italic font-normal text-transparent">
                    WhatsApp group
                  </span>
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <p className="mt-5 text-base leading-relaxed text-white/45 max-w-md">
                  Stay close to your ministry family between Sundays — prayer requests, updates, encouragement, and community, right in your pocket.
                </p>
              </ScrollReveal>
            </div>
            {/* right — interactive finder */}
            <ScrollReveal delay={0.15}>
              <GroupFinder />
            </ScrollReveal>
          </div>
        </div>
      </section>
    </main>
  );
}
