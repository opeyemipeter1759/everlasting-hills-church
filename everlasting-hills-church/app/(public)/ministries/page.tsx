import Link from "next/link";
import { Music, HandHeart, Baby, Flame, Users, Video, Megaphone, BookOpen, ArrowRight } from "lucide-react";
import PageHero from "@/components/marketing/PageHero";
import { getStructuredContent } from "@/lib/cms-page";

export const metadata = {
  title: "Ministries — Everlasting Hills Church",
  description: "Explore the ministry units of Everlasting Hills Church and find where you can belong and serve.",
};

const UNIT_ICONS = [Music, HandHeart, Baby, Flame, Users, Video, Megaphone, BookOpen];

interface MinistriesContent {
  eyebrow: string;
  title: string;
  accent: string;
  lead: string;
  ministries: { name: string; body: string }[];
  cta: { heading: string; body: string };
}

const FALLBACK: MinistriesContent = {
  eyebrow: "Get Involved",
  title: "Find where you",
  accent: "belong",
  lead: "Everyone has a place and a part to play. Explore our ministry units and discover where God has gifted you to serve.",
  ministries: [
    { name: "Worship & Music", body: "Leading the family into the presence of God through song, sound, and a lifestyle of worship." },
    { name: "Hospitality & Ushering", body: "The first smile you meet. Creating a warm, ordered, and welcoming house for everyone who comes." },
    { name: "Children", body: "Discipling the next generation with age-appropriate teaching, care, and a whole lot of joy." },
    { name: "Youth & Teens", body: "Raising a bold generation that loves God, owns their faith, and lives with purpose." },
    { name: "Small Groups", body: "Where the church becomes family. Doing life, growing in the word, and praying together midweek." },
    { name: "Media & Tech", body: "Carrying the message beyond the walls through sound, streaming, design, and storytelling." },
    { name: "Evangelism & Outreach", body: "Taking the love of God into the city, serving the community, and reaching the lost." },
    { name: "Prayer & Intercession", body: "The engine room. Standing in the gap for the church, the city, and the nations." },
  ],
  cta: { heading: "Ready to serve?", body: "Tell us where your heart is drawn and our team will help you take the next step into a ministry unit." },
};

function isValid(c: unknown): c is MinistriesContent {
  return Boolean(c && Array.isArray((c as MinistriesContent).ministries));
}

export default async function MinistriesPage({ searchParams }: { searchParams: { preview?: string } }) {
  const c = await getStructuredContent("ministries", { preview: searchParams.preview, fallback: FALLBACK, valid: isValid });

  return (
    <main className="bg-white">
      {searchParams.preview && <div className="bg-[#87102C] text-white text-center text-xs font-semibold py-2 tracking-wide">PREVIEW — draft, not published</div>}
      <PageHero eyebrow={c.eyebrow} title={c.title} accent={c.accent} lead={c.lead} />

      <section className="mx-auto max-w-[1100px] px-5 py-20 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {c.ministries.map((m, i) => {
            const Icon = UNIT_ICONS[i % UNIT_ICONS.length];
            return (
              <div key={i} className="group rounded-3xl border border-brand-rose/60 bg-brand-blush/40 p-7 transition-all hover:-translate-y-1 hover:border-[#87102C]/30 hover:shadow-[0_8px_30px_rgba(135,16,44,0.08)]">
                <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#87102C]/10 text-[#87102C] transition-colors group-hover:bg-[#87102C] group-hover:text-white"><Icon size={22} /></span>
                <h3 className="mb-2 text-lg font-bold text-[#111]">{m.name}</h3>
                <p className="text-sm leading-relaxed text-[#4a4a4a]">{m.body}</p>
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
            <Link href="/connect/serve" className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-7 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-[#6E0C24]">Join a Team<ArrowRight size={16} /></Link>
            <Link href="/connect" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-white/5">Connect With Us</Link>
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
