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
          </div>
        </div>
      </section>
    </main>
  );
}
