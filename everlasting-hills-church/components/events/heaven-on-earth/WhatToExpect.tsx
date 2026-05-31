import { Flame, MessageCircle, Mic2, Users } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";

/**
 * What to Expect — 4 Elevated Cards with Number Accents from the design system.
 * Light alternating section (blush bg) following the bento. Each card has:
 *   - Lucide icon in a colored rounded square
 *   - Faint large number accent in the corner (01, 02, 03, 04)
 *   - Short headline + body
 *   - Hover lift
 */

interface Item {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ITEMS: Item[] = [
  {
    number: "01",
    icon: <Flame size={20} />,
    title: "Encounter",
    description:
      "Time set apart for God to move — not a program, but a posture. Come expecting Him.",
  },
  {
    number: "02",
    icon: <Mic2 size={20} />,
    title: "Powerful Worship",
    description:
      "A live band leading us into the throne room. Songs that lift our eyes and loosen our hearts.",
  },
  {
    number: "03",
    icon: <MessageCircle size={20} />,
    title: "Life-Changing Teaching",
    description:
      "Scripture taught with weight and warmth — Word that travels home with you and reshapes the week.",
  },
  {
    number: "04",
    icon: <Users size={20} />,
    title: "Community & Fellowship",
    description:
      "Hours among the family — laughter, prayer, and the kind of conversations that turn strangers into kin.",
  },
];

export default function WhatToExpect() {
  return (
    <section className="py-24 md:py-32 bg-[#FFF4F6]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <ScrollReveal>
          <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3">
            What to Expect
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.1] tracking-tight text-balance max-w-2xl">
            Four hours.{" "}
            <span className="text-[#87102C] font-serif italic">
              Four reasons to come.
            </span>
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="mt-4 text-[#555] text-base sm:text-lg leading-relaxed max-w-2xl">
            Worship, teaching, community, encounter — held together by a hunger
            for the King and a willingness to make room for Him to come.
          </p>
        </ScrollReveal>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
          {ITEMS.map((item, i) => (
            <ScrollReveal key={item.number} delay={0.3 + i * 0.08}>
              <article className="group relative h-full overflow-hidden rounded-2xl bg-white border border-[#E7CDD3]/60 p-8 hover:border-[#E7CDD3] hover:shadow-[0_12px_50px_rgba(135,16,44,0.12)] hover:-translate-y-1 transition-all duration-300">
                {/* Number accent — large faint number bottom-right */}
                <span
                  aria-hidden="true"
                  className="absolute -bottom-4 -right-2 text-7xl sm:text-8xl font-bold text-[#FFE8ED] select-none group-hover:text-[#FFB3C1]/30 transition-colors duration-500"
                >
                  {item.number}
                </span>

                <div className="relative">
                  <span className="inline-flex w-12 h-12 rounded-xl bg-[#FFE8ED] text-[#87102C] items-center justify-center mb-5 group-hover:bg-[#87102C] group-hover:text-white transition-colors duration-300">
                    {item.icon}
                  </span>
                  <h3 className="text-xl font-bold leading-tight text-[#111] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#555] leading-relaxed max-w-md">
                    {item.description}
                  </p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
