import Link from "next/link";
import { MapPin, Clock, Car, Heart, Coffee, ArrowRight } from "lucide-react";
import PageHero from "@/components/marketing/PageHero";
import { CHURCH } from "@/config/config";
import { getStructuredContent } from "@/lib/cms-page";

export const metadata = {
  title: "Plan a Visit — Everlasting Hills Church",
  description:
    "Everything you need for your first visit to Everlasting Hills Church, Ibadan: service times, location, and what to expect.",
};

const MAP_EMBED_URL = `https://www.google.com/maps?q=${CHURCH.lat},${CHURCH.lng}&z=15&output=embed`;
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${CHURCH.lat},${CHURCH.lng}`;
const EXPECT_ICONS = [Clock, Heart, Coffee, Car];

interface VisitContent {
  eyebrow: string;
  title: string;
  accent: string;
  lead: string;
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
  serviceTimesHeading: "Service Times",
  serviceTimes: [
    { name: "Sunday Service", day: "Sunday", time: "9:00 AM – 12:00 PM" },
    { name: "Midweek Service", day: "Wednesday", time: "5:30 PM – 8:00 PM" },
  ],
  locationHeading: "Location",
  address: CHURCH.address,
  expect: { label: "What to Expect", heading: "Your first visit, simplified" },
  expectItems: [
    { title: "How long is service?", body: "Sunday gatherings run about three hours of worship, the word, and prayer. Come as you are and stay as long as you can." },
    { title: "What should I wear?", body: "There is no dress code. Most people come smart-casual, but you are welcome exactly as you are." },
    { title: "Will I be noticed?", body: "Only in the best way. Our hospitality team will welcome you, and there is no pressure to give or sign up for anything." },
    { title: "Is there parking?", body: "Yes. Parking is available on site, and our ushers will help you find your way in." },
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
      <PageHero eyebrow={c.eyebrow} title={c.title} accent={c.accent} lead={c.lead} />

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
          <div className="grid gap-6 sm:grid-cols-2">
            {c.expectItems.map((item, i) => {
              const Icon = EXPECT_ICONS[i % EXPECT_ICONS.length];
              return (
                <div key={i} className="rounded-3xl border border-brand-rose/60 bg-white p-7">
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#87102C]/10 text-[#87102C]"><Icon size={20} /></span>
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
