import Link from "next/link";
import { Quote, ArrowRight, Mail, Instagram } from "lucide-react";
import PageHero from "@/components/marketing/PageHero";

export const metadata = {
  title: "Our Pastors — Everlasting Hills Church",
  description:
    "Meet the pastors of Everlasting Hills Church, Ibadan — the lead and associate pastors who shepherd the EHC family.",
};

// TODO: replace photo with a real portrait path (or null to keep the branded placeholder).
const PASTORS = [
  {
    name: "Pastor [Lead Name]",
    role: "Lead Pastor",
    photo: null as string | null,
    quote:
      "Our one ambition is that every person who walks through these doors would meet the living God and discover the inheritance He has prepared for them.",
    scripture: "Genesis 49:26",
    scriptureText: "The blessings of your father have surpassed the blessings of my ancestors…",
    bio: [
      "Pastor [Lead Name] leads Everlasting Hills Church with a deep passion for the word of God and a fatherly heart for people. For over [X] years he has given himself to teaching, discipleship, and raising leaders across Ibadan and beyond.",
      "Known for clear, life-applicable teaching, he carries a burden to see believers rooted, fruitful, and sent into every sphere of society — the same blessing spoken over Joseph in Genesis 49.",
      "He is married to [Spouse Name], and together they give themselves to the care of the church family and the next generation.",
    ],
    email: "#",
    instagram: "#",
  },
  {
    name: "Pastor [Associate Name]",
    role: "Associate Pastor",
    photo: null as string | null,
    quote:
      "Every believer carries heaven's assignment. My joy is helping people discover theirs and walk in it with confidence.",
    scripture: "Ephesians 4:12",
    scriptureText: "…to equip his people for works of service, so that the body of Christ may be built up.",
    bio: [
      "Pastor [Associate Name] serves alongside the lead pastor with a heart for pastoral care, discipleship, and the practical flourishing of every member of the EHC family.",
      "With a gifting in teaching and a love for people, they help build the infrastructure of community and care that allows the church to grow in depth as well as numbers.",
      "They are married to [Spouse Name], and together they are passionate about family, mentorship, and seeing the next generation planted in the house of God.",
    ],
    email: "#",
    instagram: "#",
  },
];

export default function OurPastorsPage() {
  return (
    <main className="bg-white">
      <PageHero
        eyebrow="Leadership"
        title="Meet our"
        accent="pastors"
        lead="Shepherds of the Everlasting Hills Church family — given to the word, to people, and to the next generation."
      />

      {/* Pastor Cards */}
      <section className="mx-auto max-w-[1100px] px-5 py-20 sm:px-8">
        <div className="grid gap-14 md:grid-cols-2 md:gap-10">
          {PASTORS.map((pastor) => (
            <article
              key={pastor.role}
              className="flex flex-col rounded-3xl border border-brand-rose/50 bg-white shadow-[0_2px_24px_rgba(135,16,44,0.06)] overflow-hidden"
            >
              {/* Photo */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#1a0509]">
                {pastor.photo ? (
                  <img
                    src={pastor.photo}
                    alt={pastor.name}
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                ) : (
                  /* Branded placeholder until real portrait is supplied */
                  <>
                    {/* Radial glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#3d0a15] via-[#1a0509] to-[#0e0305]" />
                    <div className="absolute left-1/2 top-[30%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#87102C]/25 blur-[80px]" />
                    {/* Silhouette */}
                    <svg
                      viewBox="0 0 200 260"
                      className="absolute bottom-0 left-1/2 w-[65%] -translate-x-1/2"
                      aria-hidden="true"
                    >
                      {/* Head */}
                      <ellipse cx="100" cy="72" rx="36" ry="40" fill="#87102C" opacity="0.55" />
                      {/* Shoulders / body */}
                      <path
                        d="M20 260 C20 180 44 155 100 148 C156 155 180 180 180 260Z"
                        fill="#87102C"
                        opacity="0.45"
                      />
                    </svg>
                    {/* Subtle cross watermark */}
                    <div className="absolute right-5 top-5 opacity-10">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <rect x="13" y="2" width="6" height="28" rx="2" fill="white" />
                        <rect x="2" y="10" width="28" height="6" rx="2" fill="white" />
                      </svg>
                    </div>
                  </>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <p className="text-xl font-bold text-white">{pastor.name}</p>
                  <p className="mt-0.5 text-sm font-semibold text-church-accent">{pastor.role}</p>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-7">
                {/* Quote */}
                <div className="mb-6">
                  <Quote className="mb-3 text-[#87102C]/25" size={32} />
                  <p className="text-balance text-lg font-medium italic leading-relaxed text-[#111]">
                    &ldquo;{pastor.quote}&rdquo;
                  </p>
                </div>

                {/* Scripture */}
                <div className="mb-6 rounded-xl border border-brand-rose/40 bg-brand-blush px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#87102C] mb-1">
                    {pastor.scripture}
                  </p>
                  <p className="text-sm italic text-[#4a4a4a] leading-relaxed">
                    &ldquo;{pastor.scriptureText}&rdquo;
                  </p>
                </div>

                {/* Bio */}
                <div className="space-y-3 flex-1">
                  {pastor.bio.map((para, i) => (
                    <p key={i} className="text-sm leading-relaxed text-[#4a4a4a]">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Social / contact */}
                <div className="mt-6 flex items-center gap-3 border-t border-brand-rose/30 pt-5">
                  <a
                    href={`mailto:${pastor.email}`}
                    aria-label="Email"
                    className="inline-flex items-center justify-center rounded-xl border border-[#87102C]/20 p-2.5 text-[#87102C] transition-colors hover:bg-[#87102C]/5"
                  >
                    <Mail size={16} />
                  </a>
                  <a
                    href={pastor.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="inline-flex items-center justify-center rounded-xl border border-[#87102C]/20 p-2.5 text-[#87102C] transition-colors hover:bg-[#87102C]/5"
                  >
                    <Instagram size={16} />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-church-dark py-20 text-center text-white">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.4em] text-church-accent">
            Come as you are
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            There is a place for you at EHC
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/55 leading-relaxed">
            Our pastors would love to meet you. Join us this Sunday or reach out — every newcomer is welcomed as family.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/visit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-7 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-[#6E0C24]"
            >
              Plan a Visit
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/sermons"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-white/5"
            >
              Listen to Sermons
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
