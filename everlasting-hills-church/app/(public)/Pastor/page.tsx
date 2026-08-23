import Link from "next/link";
import { ArrowRight, Mail, Instagram } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";

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
      {/* Hero — no photo. Asymmetric, agency-style layout: oversized left-aligned
          type against one confidently-scaled graphic mark (the church's own
          mountain motif), plus print-precision registration ticks and a hairline
          meta row. Pure white, one burgundy touch. */}
      <section className="relative overflow-hidden bg-white">
        {/* Corner registration ticks — a small "designed with intent" detail */}
        <span className="absolute left-6 top-6 h-3 w-3 border-l border-t border-black/20 sm:left-8 sm:top-8" />
        <span className="absolute right-6 top-6 h-3 w-3 border-r border-t border-black/20 sm:right-8 sm:top-8" />
        <span className="absolute bottom-6 left-6 h-3 w-3 border-b border-l border-black/20 sm:bottom-8 sm:left-8" />
        <span className="absolute bottom-6 right-6 h-3 w-3 border-b border-r border-black/20 sm:bottom-8 sm:right-8" />

        <div className="mx-auto max-w-6xl px-6 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-36">
          {/* Headline row — left-aligned type against a large-scale mountain mark */}
          <div className="flex items-end justify-between gap-8">
            <div>
              <p className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.5em] text-black/40">
                <span className="h-1.5 w-1.5 bg-[#87102C]" />
                Leadership
              </p>
              <h1 className="mt-6 max-w-3xl text-balance font-serif text-5xl font-normal leading-[1.02] tracking-tight text-[#111] sm:text-7xl lg:text-[5.25rem]">
                Meet Our Pastors
              </h1>
            </div>
            <svg
              viewBox="0 0 40 40"
              fill="none"
              aria-hidden="true"
              className="hidden h-24 w-24 shrink-0 text-[#87102C] sm:block sm:h-28 sm:w-28 lg:h-32 lg:w-32"
            >
              <path d="M4 32L20 8L36 32H4Z" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <path d="M11 32L20 14L29 32H11Z" stroke="currentColor" strokeWidth="1" opacity="0.55" />
              <path d="M16 32L20 20L24 32H16Z" fill="currentColor" />
            </svg>
          </div>

          {/* Meta row — lead paragraph + a small locational detail, split by a hairline */}
          <div className="mt-12 flex flex-col gap-6 border-t border-black/[0.09] pt-7 sm:flex-row sm:items-start sm:justify-between">
            <p className="max-w-md text-base leading-relaxed text-black/50">
              Shepherds of the Everlasting Hills Church family — given to the word, to people, and to the next generation.
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-black/30">
              Everlasting Hills Church — Ibadan
            </p>
          </div>
        </div>
      </section>

      {/* Pastor features — alternating editorial layout */}
      <section>
        {PASTORS.map((pastor, i) => {
          const reversed = i % 2 === 1;
          return (
            <ScrollReveal key={pastor.role}>
              <article className={`border-black/[0.07] ${i > 0 ? "border-t" : ""}`}>
                <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
                  <div className="grid items-start gap-12 md:grid-cols-2 md:gap-20">
                    {/* Photo */}
                    <div className={reversed ? "md:order-2" : ""}>
                      <p className="mb-5 font-serif text-sm tracking-[0.3em] text-black/25">
                        0{i + 1}
                      </p>
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#141414]">
                        {pastor.photo ? (
                          <img
                            src={pastor.photo}
                            alt={pastor.name}
                            className="absolute inset-0 h-full w-full object-cover object-top"
                          />
                        ) : (
                          <PortraitPlaceholder />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className={reversed ? "md:order-1" : ""}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#87102C]">
                        {pastor.role}
                      </p>
                      <h2 className="mt-3 text-balance font-serif text-3xl font-normal tracking-tight text-[#111] sm:text-4xl">
                        {pastor.name}
                      </h2>

                      <blockquote className="mt-9 border-l-2 border-black/10 pl-6">
                        <p className="text-balance font-serif text-xl italic leading-relaxed text-[#1a1a1a]">
                          &ldquo;{pastor.quote}&rdquo;
                        </p>
                      </blockquote>

                      <div className="mt-8 space-y-4">
                        {pastor.bio.map((para, j) => (
                          <p key={j} className="text-[15px] leading-relaxed text-[#5a5a5a]">
                            {para}
                          </p>
                        ))}
                      </div>

                      <div className="mt-9 border-t border-black/[0.08] pt-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/35">
                          {pastor.scripture}
                        </p>
                        <p className="mt-1.5 text-sm italic leading-relaxed text-black/45">
                          &ldquo;{pastor.scriptureText}&rdquo;
                        </p>
                      </div>

                      <div className="mt-7 flex items-center gap-3">
                        <a
                          href={`mailto:${pastor.email}`}
                          aria-label="Email"
                          className="inline-flex items-center justify-center rounded-full border border-black/10 p-2.5 text-black/50 transition-colors hover:border-[#87102C]/30 hover:text-[#87102C]"
                        >
                          <Mail size={15} />
                        </a>
                        <a
                          href={pastor.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Instagram"
                          className="inline-flex items-center justify-center rounded-full border border-black/10 p-2.5 text-black/50 transition-colors hover:border-[#87102C]/30 hover:text-[#87102C]"
                        >
                          <Instagram size={15} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          );
        })}
      </section>

      {/* CTA */}
      <section className="bg-[#0a0a0a] py-24 text-center text-white">
        <div className="mx-auto max-w-xl px-6 sm:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/35">
            Come as you are
          </p>
          <h2 className="mt-4 text-balance font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            There is a place for you at EHC
          </h2>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-white/45">
            Our pastors would love to meet you. Join us this Sunday or reach out — every newcomer is welcomed as family.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/visit"
              className="inline-flex items-center gap-2 rounded-full bg-[#87102C] px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-[#6E0C24]"
            >
              Plan a Visit
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/sermons"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-white/5"
            >
              Listen to Sermons
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/** Quiet monochrome placeholder until a real portrait is supplied — no brand-color fills. */
function PortraitPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#141414]">
      <svg viewBox="0 0 200 260" className="w-[42%] opacity-[0.14]" aria-hidden="true">
        <circle cx="100" cy="76" r="38" fill="none" stroke="white" strokeWidth="1.5" />
        <path
          d="M22 258 C22 176 48 150 100 150 C152 150 178 176 178 258"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}
