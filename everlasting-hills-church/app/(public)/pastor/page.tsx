import Link from "next/link";
import Image from "next/image";
import { Quote, ArrowRight } from "lucide-react";
import PageHero from "@/components/marketing/PageHero";

export const metadata = {
  title: "Our Lead Pastor — Everlasting Hills Church",
  description:
    "Meet the lead pastor of Everlasting Hills Church, Ibadan, and the heart behind the house.",
};

// TODO: replace with the real pastor name, photo, and bio (or wire to Site Settings later).
const PASTOR = {
  name: "Pastor [Full Name]",
  role: "Lead Pastor",
  photo: "/images/church_congregation_1_1779193592146.png",
  quote:
    "Our one ambition is that every person who walks through these doors would meet the living God and discover the inheritance He has prepared for them.",
  bio: [
    "Pastor [Full Name] leads Everlasting Hills Church with a deep passion for the word of God and a fatherly heart for people. For over [X] years he has given himself to teaching, discipleship, and raising leaders across Ibadan and beyond.",
    "Known for clear, life-applicable teaching, he carries a burden to see believers rooted, fruitful, and sent into every sphere of society, the same blessing spoken over Joseph in Genesis 49.",
    "He is married to [Spouse Name], and together they give themselves to the care of the church family and the next generation.",
  ],
};

export default function PastorPage() {
  return (
    <main className="bg-white">
      <PageHero
        eyebrow="Leadership"
        title="Meet our"
        accent="lead pastor"
        lead="The heart behind the house, given to the word, to people, and to the next generation."
      />

      <section className="mx-auto max-w-[1100px] px-5 py-20 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-16">
          {/* Photo */}
          <div className="relative overflow-hidden rounded-3xl border border-brand-rose/60">
            <Image
              src={PASTOR.photo}
              alt={PASTOR.name}
              width={720}
              height={900}
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <p className="text-xl font-bold text-white">{PASTOR.name}</p>
              <p className="text-sm text-church-accent">{PASTOR.role}</p>
            </div>
          </div>

          {/* Bio */}
          <div>
            <Quote className="mb-4 text-[#87102C]/30" size={40} />
            <p className="mb-8 text-balance text-2xl font-medium italic leading-relaxed text-[#111] sm:text-[1.7rem]">
              {PASTOR.quote}
            </p>
            {PASTOR.bio.map((para, i) => (
              <p
                key={i}
                className="mb-4 text-base leading-relaxed text-[#4a4a4a]"
              >
                {para}
              </p>
            ))}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sermons"
                className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-7 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#6E0C24]"
              >
                Listen to Sermons
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/visit"
                className="inline-flex items-center gap-2 rounded-xl border border-[#87102C]/30 px-7 py-3.5 text-sm font-semibold text-[#87102C] transition-colors hover:bg-[#87102C]/5"
              >
                Plan a Visit
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
