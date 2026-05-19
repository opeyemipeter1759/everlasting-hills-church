"use client";

import ScrollReveal from "./ScrollReveal";

// ── Update these cards to reflect your church values ──
const cultureCards = [
  {
    id: "word",
    label: "Word",
    icon: BookIcon,
    headline: "Shaped by Scripture",
    body: "We are formed by the truth of God's Word. Everything we do — how we think, love, and live — flows from a sincere engagement with Scripture.",
    accent: "#87102C",
    bg: "bg-[#FFF4F6]",
    border: "border-[#E7CDD3]",
    verse: "2 Tim. 3:16",
  },
  {
    id: "spirit",
    label: "Spirit",
    icon: FlameIcon,
    headline: "Alive in the Spirit",
    body: "We depend on the life and power of the Holy Spirit for everything. He is not a concept — He is the reason we move, breathe, and minister.",
    accent: "#87102C",
    bg: "bg-[#87102C]",
    border: "border-transparent",
    verse: "John 4:24",
    inverted: true,
  },
  {
    id: "community",
    label: "Community",
    icon: PeopleIcon,
    headline: "Family, Not a Crowd",
    body: "We grow as a family, not just as a gathering. Real relationships, shared lives, and genuine accountability — that's the community we build.",
    accent: "#87102C",
    bg: "bg-[#FFF4F6]",
    border: "border-[#E7CDD3]",
    verse: "Acts 2:44",
  },
];

export default function CultureSection() {
  return (
    <section
      id="culture"
      className="py-24 md:py-32 bg-white"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <ScrollReveal>
            <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3">
              Our Culture
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-[#111] leading-[1.1] tracking-tight text-balance">
              {/* ── Culture section heading — edit freely ── */}
              What we are about
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="mt-4 text-[#555] text-base sm:text-lg leading-relaxed">
              Three convictions at the heart of everything we do.
            </p>
          </ScrollReveal>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          {cultureCards.map((card, i) => (
            <ScrollReveal key={card.id} delay={0.1 + i * 0.12}>
              <div
                className={`relative rounded-2xl border p-8 h-full flex flex-col ${card.bg} ${card.border} overflow-hidden group hover:-translate-y-1 transition-transform duration-300`}
              >
                {/* Subtle pattern */}
                {card.inverted && (
                  <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='2' cy='2' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  />
                )}

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                    card.inverted
                      ? "bg-white/15"
                      : "bg-[#87102C]/8"
                  }`}
                >
                  <card.icon inverted={card.inverted} />
                </div>

                {/* Pillar label */}
                <p
                  className={`text-xs tracking-[0.2em] uppercase font-semibold mb-2 ${
                    card.inverted ? "text-white/50" : "text-[#87102C]/60"
                  }`}
                >
                  {card.label}
                </p>

                {/* Headline */}
                <h3
                  className={`text-xl font-bold mb-3 leading-tight ${
                    card.inverted ? "text-white" : "text-[#111]"
                  }`}
                >
                  {card.headline}
                </h3>

                {/* Body */}
                <p
                  className={`text-sm leading-relaxed flex-1 ${
                    card.inverted ? "text-white/70" : "text-[#555]"
                  }`}
                >
                  {card.body}
                </p>

                {/* Verse tag */}
                <div
                  className={`mt-6 inline-flex self-start items-center px-3 py-1 rounded-full text-xs font-medium ${
                    card.inverted
                      ? "bg-white/15 text-white/70"
                      : "bg-[#87102C]/8 text-[#87102C]"
                  }`}
                >
                  {card.verse}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// Inline SVG icons
function BookIcon({ inverted }: { inverted?: boolean }) {
  const c = inverted ? "#fff" : "#87102C";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 19.5A2.5 2.5 0 016.5 17H20"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlameIcon({ inverted }: { inverted?: boolean }) {
  const c = inverted ? "#fff" : "#87102C";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8.5 14.5A5 5 0 0012 19c2.76 0 5-2.24 5-5 0-2.5-1.5-4.5-3.5-6-.5 2-2 3-3 3.5-.5-1-.5-2.5.5-4-2 1.5-2.5 3.5-2.5 5.5 0 .37.02.73.05 1.09"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 19c-1.5 0-2.5-1-2.5-2.5 0-2 2.5-3.5 2.5-3.5s2.5 1.5 2.5 3.5C14.5 18 13.5 19 12 19z"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PeopleIcon({ inverted }: { inverted?: boolean }) {
  const c = inverted ? "#fff" : "#87102C";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="9"
        cy="7"
        r="4"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
