"use client";

import ScrollReveal from "./ScrollReveal";
import { ArrowRight, Users, Heart } from "lucide-react";

export default function CommunitySection() {
  return (
    <section id="community" className="py-24 md:py-32 bg-[#FFF4F6]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text content */}
          <div>
            <ScrollReveal>
              <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3">
                You Belong Here
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.08] tracking-tight mb-5 text-balance">
                {/* ── Heading — edit freely ── */}
                Become part of something real
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-[#555] text-base sm:text-lg leading-relaxed mb-4">
                {/* ── Paragraph 1 — edit freely ── */}
                Community at Everlasting Hills is not a program. It is a way of
                life. We are people who genuinely do life together — in worship,
                in prayer, in celebration, and in the hard seasons.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <p className="text-[#555] text-base sm:text-lg leading-relaxed mb-8">
                {/* ── Paragraph 2 — edit freely ── */}
                Whether you are taking your very first step of faith or you have
                walked with God for decades, there is a place for you here.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* ── Primary CTA — update link when form/page is ready ── */}
                <a
                  href="#contact"
                  className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-all duration-200 hover:shadow-lg hover:shadow-burgundy/25 hover:-translate-y-0.5"
                >
                  <Users size={15} />
                  I&rsquo;m New Here
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </a>
                {/* ── Secondary CTA — update link to your community groups page ── */}
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full border border-[#E7CDD3] text-[#87102C] text-sm font-semibold hover:bg-white transition-colors"
                >
                  <Heart size={15} />
                  Join a Community
                </a>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Visual cluster */}
          <ScrollReveal delay={0.15} direction="right">
            <div className="relative">
              {/* Main card */}
              <div
                className="relative rounded-2xl overflow-hidden p-10 text-center"
                style={{
                  background:
                    "linear-gradient(135deg, #87102C 0%, #4a0819 100%)",
                  minHeight: "420px",
                }}
              >
                {/* Pattern */}
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='1.5' cy='1.5' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />

                <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[360px]">
                  {/* People icon circles */}
                  <div className="flex items-center justify-center mb-8">
                    {["W", "S", "A", "E", "C"].map((letter, i) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded-full border-2 border-[#6E0C24] bg-gradient-to-br from-[#FFE8ED]/20 to-[#FFE8ED]/5 flex items-center justify-center text-white font-bold text-sm -ml-2 first:ml-0"
                        style={{ zIndex: 5 - i }}
                      >
                        {letter}
                      </div>
                    ))}
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 bg-white/8 flex items-center justify-center text-white/40 text-xs -ml-2">
                      +
                    </div>
                  </div>

                  <p className="text-white/50 text-xs tracking-[0.2em] uppercase mb-3">
                    You are welcome
                  </p>
                  <h3 className="text-white text-2xl font-bold mb-4 leading-tight">
                    A family that prays,
                    <br />
                    grows, and stays
                  </h3>
                  <p className="text-white/55 text-sm leading-relaxed max-w-xs">
                    {/* ── Small tagline in the visual card ── */}
                    No background check. No dress code. Just come, and you will
                    belong.
                  </p>

                  {/* Decorative bottom divider */}
                  <div className="absolute bottom-0 inset-x-0 h-px bg-white/10" />
                </div>
              </div>

              {/* Floating stat */}
              <div className="absolute -bottom-5 -left-4 md:-left-6 bg-white rounded-xl shadow-[0_8px_32px_rgba(135,16,44,0.12)] border border-[#E7CDD3]/60 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFE8ED] flex items-center justify-center flex-shrink-0">
                  <Heart size={16} className="text-[#87102C]" fill="#87102C" />
                </div>
                <div>
                  <p className="text-[#111] font-bold text-base leading-none">
                    Real Community
                  </p>
                  <p className="text-[#999] text-xs mt-1">Not just a service</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
