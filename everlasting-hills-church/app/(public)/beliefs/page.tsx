import Link from "next/link";
import { Sprout, Shield, Mountain, Gift, Crown } from "lucide-react";
import PageHero from "@/components/marketing/PageHero";

export const metadata = {
  title: "What We Believe — Everlasting Hills Church",
  description:
    "Five pillars drawn from Genesis 49:22-26 that shape who we are and how we live.",
};

const PILLARS = [
  {
    icon: Sprout,
    n: "01",
    title: "Fruitfulness",
    verse: "Genesis 49:22",
    text: "Joseph is a fruitful bough by a well. We believe every life joined to Christ, the well that never runs dry, is meant to be fruitful, with branches that run over the wall into every sphere of society.",
  },
  {
    icon: Shield,
    n: "02",
    title: "Endurance",
    verse: "Genesis 49:23-24",
    text: "Though the archers shot at him, his bow abode in strength. We believe in standing firm under pressure, holding our confession through trials, anchored by a faith that does not bend.",
  },
  {
    icon: Mountain,
    n: "03",
    title: "Divine Strength",
    verse: "Genesis 49:24",
    text: "His strength came from the mighty God of Jacob, the Shepherd, the Stone of Israel. We believe our sufficiency is not in ourselves but in the God who upholds and shepherds His people.",
  },
  {
    icon: Gift,
    n: "04",
    title: "Abundant Blessing",
    verse: "Genesis 49:25",
    text: "Blessings of heaven above, of the deep beneath, and of every kind. We believe in the generous God who blesses His children fully, so that they in turn become a blessing to many.",
  },
  {
    icon: Crown,
    n: "05",
    title: "The Everlasting Hills",
    verse: "Genesis 49:26",
    text: "His blessings prevail unto the utmost bound of the everlasting hills. We believe we are called to a lasting, generational inheritance, crowned and set apart for God's enduring purpose.",
  },
];

export default function BeliefsPage() {
  return (
    <main className="bg-white">
      <PageHero
        eyebrow="What We Believe"
        title="Five pillars from"
        accent="Genesis 49:22-26"
        lead="The blessing spoken over Joseph still shapes a people who give themselves fully to God. These five pillars frame everything we are."
      />

      <section className="mx-auto max-w-[1000px] px-5 py-20 sm:px-8">
        <div className="space-y-6">
          {PILLARS.map(({ icon: Icon, n, title, verse, text }) => (
            <div
              key={n}
              className="group grid gap-6 rounded-3xl border border-brand-rose/60 bg-brand-blush/40 p-8 transition-colors hover:border-[#87102C]/30 sm:grid-cols-[auto_1fr] sm:p-10"
            >
              <div className="flex items-start gap-4">
                <span className="inline-flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#87102C]/10 text-[#87102C]">
                  <Icon size={24} />
                </span>
                <span className="font-display text-3xl font-black text-[#87102C]/20 sm:hidden">
                  {n}
                </span>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-[#111]">{title}</h2>
                  <span className="rounded-full bg-[#87102C]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#87102C]">
                    {verse}
                  </span>
                </div>
                <p className="text-base leading-relaxed text-[#4a4a4a]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-church-dark py-20 text-center text-white">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Come and see for yourself
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/55">
            These are not just words on a page. Join us on a Sunday and
            experience them in a living family.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/visit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-7 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-[#6E0C24]"
            >
              Plan a Visit
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-white/5"
            >
              About Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
