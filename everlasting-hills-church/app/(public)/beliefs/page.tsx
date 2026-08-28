import Link from "next/link";
import { Sprout, Shield, Mountain, Gift, Crown } from "lucide-react";
import PageHero from "@/components/marketing/PageHero";
import { getStructuredContent } from "@/lib/cms-page";

export const metadata = {
  title: "What We Believe — Everlasting Hills Church",
  description:
    "Five pillars drawn from Genesis 49:22-26 that shape who we are and how we live.",
};

// The design is fixed; only the copy is CMS-managed. Icons + numbers are positional.
const PILLAR_ICONS = [Sprout, Shield, Mountain, Gift, Crown];

interface Pillar { title: string; verse: string; text: string }
interface BeliefsContent {
  eyebrow: string;
  title: string;
  accent: string;
  lead: string;
  heroImage: string | null;
  pillars: Pillar[];
  cta: { heading: string; body: string };
}

/** Current content — the fallback if the CMS has nothing published (or is down). */
const FALLBACK: BeliefsContent = {
  eyebrow: "What We Believe",
  title: "Five pillars from",
  accent: "Genesis 49:22-26",
  lead: "The blessing spoken over Joseph still shapes a people who give themselves fully to God. These five pillars frame everything we are.",
  heroImage: null,
  pillars: [
    { title: "Fruitfulness", verse: "Genesis 49:22", text: "Joseph is a fruitful bough by a well. We believe every life joined to Christ, the well that never runs dry, is meant to be fruitful, with branches that run over the wall into every sphere of society." },
    { title: "Endurance", verse: "Genesis 49:23-24", text: "Though the archers shot at him, his bow abode in strength. We believe in standing firm under pressure, holding our confession through trials, anchored by a faith that does not bend." },
    { title: "Divine Strength", verse: "Genesis 49:24", text: "His strength came from the mighty God of Jacob, the Shepherd, the Stone of Israel. We believe our sufficiency is not in ourselves but in the God who upholds and shepherds His people." },
    { title: "Abundant Blessing", verse: "Genesis 49:25", text: "Blessings of heaven above, of the deep beneath, and of every kind. We believe in the generous God who blesses His children fully, so that they in turn become a blessing to many." },
    { title: "The Everlasting Hills", verse: "Genesis 49:26", text: "His blessings prevail unto the utmost bound of the everlasting hills. We believe we are called to a lasting, generational inheritance, crowned and set apart for God's enduring purpose." },
  ],
  cta: { heading: "Come and see for yourself", body: "These are not just words on a page. Join us on a Sunday and experience them in a living family." },
};

function isValid(c: unknown): c is BeliefsContent {
  return Boolean(c && Array.isArray((c as BeliefsContent).pillars) && (c as BeliefsContent).pillars.length === 5);
}

export default async function BeliefsPage({
  searchParams,
}: {
  searchParams: { preview?: string };
}) {
  const c = await getStructuredContent("about/beliefs", { preview: searchParams.preview, fallback: FALLBACK, valid: isValid });

  return (
    <main className="bg-white">
      {searchParams.preview && (
        <div className="bg-[#87102C] text-white text-center text-xs font-semibold py-2 tracking-wide">
          PREVIEW — draft, not published
        </div>
      )}
      <PageHero eyebrow={c.eyebrow} title={c.title} accent={c.accent} lead={c.lead} backgroundImage={c.heroImage} />

      <section className="mx-auto max-w-[1000px] px-5 py-20 sm:px-8">
        <div className="relative space-y-5">
          {/* Connecting thread behind the icon column — reinforces these as one
              unbroken sequence rather than five unrelated cards. */}
          <div
            aria-hidden="true"
            className="absolute bottom-10 left-[35px] top-10 hidden w-px bg-gradient-to-b from-[#87102C]/25 via-[#87102C]/10 to-transparent sm:block"
          />
          {c.pillars.map((p, i) => {
            const Icon = PILLAR_ICONS[i] ?? Sprout;
            const n = String(i + 1).padStart(2, "0");
            return (
              <div
                key={n}
                className="group relative flex flex-col gap-5 rounded-3xl border border-[#E7CDD3]/70 bg-white p-6 shadow-[0_1px_3px_rgba(135,16,44,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#87102C]/25 hover:shadow-[0_12px_28px_-8px_rgba(135,16,44,0.18)] sm:flex-row sm:items-start sm:gap-7 sm:p-8"
              >
                <div className="relative z-10 flex-shrink-0 self-start">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#87102C]/15 to-[#87102C]/5 text-[#87102C] ring-1 ring-[#87102C]/10 transition-colors group-hover:from-[#87102C]/20 group-hover:to-[#87102C]/10 sm:h-[70px] sm:w-[70px]">
                    <Icon size={26} className="sm:h-8 sm:w-8" />
                  </span>
                  <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#87102C] text-[11px] font-black text-white shadow-md ring-4 ring-white">
                    {i + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <h2 className="text-xl font-bold text-[#111] sm:text-2xl">{p.title}</h2>
                    <span className="shrink-0 rounded-full bg-[#FFE8ED] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#87102C]">
                      {p.verse}
                    </span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-[#4a4a4a] sm:text-base">{p.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-church-dark py-20 text-center text-white">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{c.cta.heading}</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/55">{c.cta.body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/visit" className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-7 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-[#6E0C24]">Plan a Visit</Link>
            <Link href="/about" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-white/5">About Us</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
