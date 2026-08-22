import Link from "next/link";
import { MapPin, Clock, Music, BookOpen, HandHeart, Users, ArrowRight } from "lucide-react";
import PageHero from "@/components/marketing/PageHero";
import { CHURCH } from "@/config/config";
import { getStructuredContent } from "@/lib/cms-page";

export const metadata = {
  title: "Plan a Visit — Everlasting Hills Church",
  description:
    "Everything you need for your first visit to Everlasting Hills Church, Ibadan: service times, location, and what to expect.",
};

const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(CHURCH.address)}&z=16&output=embed`;
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CHURCH.address)}`;
const EXPECT_ICONS = [Music, BookOpen, HandHeart, Users];

interface VisitContent {
  eyebrow: string;
  title: string;
  accent: string;
  lead: string;
  heroImage: string | null;
  serviceTimesHeading: string;
  serviceTimes: { name: string; day: string; time: string }[];
  locationHeading: string;
  address: string;
  expect: { label: string; heading: string };
  expectItems: { title: string; body: string }[];
  cta: { heading: string; body: string };
}

const FALLBACK: VisitContent = {
  eyebrow: "Plan a Visit",
  title: "We saved a",
  accent: "seat for you",
  lead: "Thinking about visiting? Here is everything you need to feel at home before you even arrive.",
  heroImage: null,
  serviceTimesHeading: "Service Times",
  serviceTimes: [
    { name: "Sunday Service", day: "Sunday", time: "8:00 AM – 12:00 PM" },
    { name: "Wednesday Service", day: "Wednesday", time: "5:30 PM – 8:00 PM" },
  ],
  locationHeading: "Location",
  address: CHURCH.address,
  expect: { label: "Every Service", heading: "Here is what you have to look forward to" },
  expectItems: [
    { title: "Worship That Lifts You", body: "Passionate, Spirit-led praise that ushers you into God's presence from the very first song." },
    { title: "The Word, Made Plain", body: "Teaching that is deep in truth yet simple enough to carry into your everyday life." },
    { title: "Prayer That Reaches Heaven", body: "Every gathering makes room for real prayer, over you and for the things weighing on your heart." },
    { title: "A Family, Not a Crowd", body: "Stay a while and you will leave knowing people's names, not just their faces." },
  ],
  cta: { heading: "Let us know you are coming", body: "Fill the first-timer form and our welcome team will be looking out for you when you arrive." },
};

function isValid(c: unknown): c is VisitContent {
  return Boolean(c && Array.isArray((c as VisitContent).serviceTimes) && Array.isArray((c as VisitContent).expectItems));
}

export default async function VisitPage({ searchParams }: { searchParams: { preview?: string } }) {
  const c = await getStructuredContent("visit", { preview: searchParams.preview, fallback: FALLBACK, valid: isValid });

  return (
    <main className="bg-white">
      {searchParams.preview && <div className="bg-[#87102C] text-white text-center text-xs font-semibold py-2 tracking-wide">PREVIEW — draft, not published</div>}
      <PageHero eyebrow={c.eyebrow} title={c.title} accent={c.accent} lead={c.lead} backgroundImage={c.heroImage} />

      {/* Service times + map */}
      <section className="mx-auto max-w-[1100px] px-5 py-20 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-brand-rose/60 bg-brand-blush/40 p-8">
              <div className="mb-5 flex items-center gap-3">
                <Clock size={20} className="text-[#87102C]" />
                <h2 className="text-xl font-bold text-[#111]">{c.serviceTimesHeading}</h2>
              </div>
              <div className="space-y-4">
                {c.serviceTimes.map((s, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-brand-rose/50 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-[#111]">{s.name}</p>
                      <p className="text-sm text-[#777]">{s.day}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#87102C]">{s.time}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-brand-rose/60 bg-brand-blush/40 p-8">
              <div className="mb-3 flex items-center gap-3">
                <MapPin size={20} className="text-[#87102C]" />
                <h2 className="text-xl font-bold text-[#111]">{c.locationHeading}</h2>
              </div>
              <p className="mb-4 text-[#4a4a4a]">{c.address}</p>
              <a href={MAP_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#87102C] hover:underline">Get directions<ArrowRight size={15} /></a>
            </div>
          </div>

          <div className="min-h-[360px] overflow-hidden rounded-3xl border border-brand-rose/60">
            <iframe src={MAP_EMBED_URL} className="h-full w-full" style={{ minHeight: "360px" }} loading="lazy" title="Church location map" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </div>
      </section>

      {/* What to expect */}
      <section className="bg-brand-blush py-20">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#87102C]">{c.expect.label}</p>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-[#111] sm:text-4xl">{c.expect.heading}</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {c.expectItems.map((item, i) => {
              const Icon = EXPECT_ICONS[i % EXPECT_ICONS.length];
              return (
                <div key={i} className="relative rounded-3xl border border-brand-rose/60 bg-white p-7">
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#87102C]/10 text-[#87102C]"><Icon size={20} /></span>
                  <h3 className="mb-2 text-lg font-bold text-[#111]">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[#4a4a4a]">{item.body}</p>
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
            <Link href="/first-timer" className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-7 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-[#6E0C24]">I am Planning to Visit<ArrowRight size={16} /></Link>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-white/5">Contact Us</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
