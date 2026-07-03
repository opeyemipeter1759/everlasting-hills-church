import Link from "next/link";
import { ArrowRight, Compass, Target, Heart } from "lucide-react";
import PageHero from "@/components/marketing/PageHero";
import { getStructuredContent } from "@/lib/cms-page";

export const metadata = {
  title: "About — Everlasting Hills Church",
  description:
    "Who we are: our story, our vision, and our mission as a church family in Ibadan, Nigeria.",
};

const CARD_ICONS = [Compass, Target, Heart];

interface AboutContent {
  eyebrow: string;
  title: string;
  accent: string;
  lead: string;
  story: { heading: string; paragraphs: string[] };
  cards: { title: string; body: string }[];
  cta: { heading: string; body: string };
}

const FALLBACK: AboutContent = {
  eyebrow: "About Us",
  title: "A family rooted in",
  accent: "the everlasting hills",
  lead: "We are a church family in Ibadan, Nigeria, pursuing God together and making room for everyone He sends our way.",
  story: {
    heading: "Built on the blessing of Genesis 49",
    paragraphs: [
      "Everlasting Hills Church began with a small gathering in Ibadan and a single conviction: that the blessing spoken over Joseph in Genesis 49 still rests on a people who will give themselves fully to God.",
      "Over the years we have grown into a vibrant family of believers across ages and backgrounds, united by worship, the word, and a shared longing to see lives transformed.",
      "Today we gather each week to encounter God, to grow in His word, and to send one another out as light into the city and beyond.",
    ],
  },
  cards: [
    { title: "Our Vision", body: "To raise a generation that lives unto the utmost bound of the everlasting hills, fruitful, rooted, and overflowing into every sphere of life and society." },
    { title: "Our Mission", body: "To make disciples through the unchanging word, authentic community, and Spirit-led service, so that every person finds a place, a people, and a purpose." },
    { title: "Our Heart", body: "We are a family before we are an organisation. We pursue God together, carry one another, and welcome every newcomer as if welcoming the Lord Himself." },
  ],
  cta: { heading: "There is a place for you here", body: "Plan your first visit, or reach out and let us know you are coming. We would love to welcome you." },
};

function isValid(c: unknown): c is AboutContent {
  return Boolean(c && Array.isArray((c as AboutContent).cards) && (c as AboutContent).story);
}

export default async function AboutPage({ searchParams }: { searchParams: { preview?: string } }) {
  const c = await getStructuredContent("about", { preview: searchParams.preview, fallback: FALLBACK, valid: isValid });

  return (
    <main className="bg-white">
      {searchParams.preview && <div className="bg-[#87102C] text-white text-center text-xs font-semibold py-2 tracking-wide">PREVIEW — draft, not published</div>}
      <PageHero eyebrow={c.eyebrow} title={c.title} accent={c.accent} lead={c.lead} />

      {/* Story */}
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-px w-10 bg-[#87102C]/40" />
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#87102C]">Our Story</p>
        </div>
        <h2 className="mb-8 text-balance text-3xl font-bold tracking-tight text-[#111] sm:text-4xl">{c.story.heading}</h2>
        {c.story.paragraphs.map((para, i) => (
          <p key={i} className={i === 0 ? "mb-4 text-lg font-medium leading-relaxed text-[#3a3a3a]" : "mb-4 text-base leading-relaxed text-[#3a3a3a]"}>{para}</p>
        ))}
      </section>

      {/* Vision / Mission / Heart */}
      <section className="bg-brand-blush py-20">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {c.cards.map((card, i) => {
              const Icon = CARD_ICONS[i] ?? Heart;
              return (
                <div key={i} className="rounded-3xl border border-brand-rose/60 bg-white p-8 shadow-[0_1px_20px_rgba(135,16,44,0.05)]">
                  <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#87102C]/10 text-[#87102C]"><Icon size={22} /></span>
                  <h3 className="mb-3 text-xl font-bold text-[#111]">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-[#4a4a4a]">{card.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-church-dark py-20 text-center text-white">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{c.cta.heading}</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/55">{c.cta.body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/visit" className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-7 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-[#6E0C24]">Plan a Visit<ArrowRight size={16} /></Link>
            <Link href="/beliefs" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-white/5">What We Believe</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
