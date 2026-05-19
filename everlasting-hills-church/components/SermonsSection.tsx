"use client";

import ScrollReveal from "./ScrollReveal";
import { Play, ArrowRight } from "lucide-react";

// ── Replace these with real sermon data when available ──
const sermons = [
  {
    id: 1,
    title: "The Person of Christ",
    description:
      "Who is Jesus — really? More than a teacher, more than a prophet. This message anchors our faith in the full person of Christ.",
    series: "Foundations",
    duration: "52 min",
    // ── Replace with your actual sermon/YouTube link ──
    link: "#",
  },
  {
    id: 2,
    title: "Built to Flourish",
    description:
      "God does not design His people for survival. He designs them to flourish. Discover what it means to live beyond limits in every season.",
    series: "Everlasting Hills",
    duration: "48 min",
    link: "#",
  },
  {
    id: 3,
    title: "Strengthened by the Mighty One",
    description:
      "When archers attack and life presses hard, what keeps your arms strong? A word from Genesis 49 on where true strength comes from.",
    series: "Everlasting Hills",
    duration: "55 min",
    link: "#",
  },
];

export default function SermonsSection() {
  return (
    <section id="sermons" className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <ScrollReveal>
              <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3">
                Recent Teachings
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.1] tracking-tight text-balance">
                {/* ── Sermons heading — edit freely ── */}
                The Word, taught with clarity
              </h2>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.2} direction="right">
            <a
              href="#"
              // ── Replace with your sermons archive page/channel ──
              className="flex items-center gap-2 text-[#87102C] text-sm font-semibold hover:gap-3 transition-all whitespace-nowrap"
            >
              View all sermons <ArrowRight size={15} />
            </a>
          </ScrollReveal>
        </div>

        {/* Sermon cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sermons.map((sermon, i) => (
            <ScrollReveal key={sermon.id} delay={0.1 + i * 0.12}>
              <article className="group flex flex-col rounded-2xl border border-[#E7CDD3]/70 bg-white overflow-hidden hover:shadow-[0_8px_40px_rgba(135,16,44,0.1)] hover:border-[#E7CDD3] transition-all duration-300 hover:-translate-y-1 h-full">
                {/* Thumbnail */}
                <div
                  className="relative aspect-video overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #87102C 0%, #4a0819 100%)",
                  }}
                >
                  {/* Pattern */}
                  <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='2' cy='2' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  />
                  {/* Title on thumbnail */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 40 40"
                      fill="none"
                      className="mb-3 opacity-30"
                      aria-hidden
                    >
                      <path
                        d="M4 32L20 8L36 32H4Z"
                        fill="white"
                        opacity="0.3"
                      />
                      <path
                        d="M11 32L20 16L29 32H11Z"
                        fill="white"
                        opacity="0.5"
                      />
                      <path d="M16 32L20 22L24 32H16Z" fill="white" />
                    </svg>
                    <p className="text-white/60 text-[10px] tracking-[0.2em] uppercase">
                      {sermon.series}
                    </p>
                  </div>
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <Play size={18} fill="white" className="text-white ml-0.5" />
                    </div>
                  </div>
                  {/* Duration badge */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                    <span className="text-white/80 text-[10px] font-medium">
                      {sermon.duration}
                    </span>
                  </div>
                </div>

                {/* Card content */}
                <div className="flex flex-col flex-1 p-6">
                  <p className="text-[#87102C]/60 text-[10px] tracking-[0.15em] uppercase font-medium mb-2">
                    {sermon.series}
                  </p>
                  <h3 className="text-[#111] font-bold text-lg leading-snug mb-3 group-hover:text-[#87102C] transition-colors">
                    {sermon.title}
                  </h3>
                  <p className="text-[#666] text-sm leading-relaxed flex-1">
                    {sermon.description}
                  </p>
                  <div className="mt-5 pt-5 border-t border-[#F0E4E7]">
                    <a
                      href={sermon.link}
                      className="flex items-center gap-2 text-[#87102C] text-sm font-semibold hover:gap-3 transition-all group-hover:gap-3"
                    >
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#FFE8ED] group-hover:bg-[#87102C] transition-colors">
                        <Play
                          size={10}
                          fill="currentColor"
                          className="text-[#87102C] group-hover:text-white transition-colors ml-0.5"
                        />
                      </span>
                      Watch Sermon
                    </a>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
