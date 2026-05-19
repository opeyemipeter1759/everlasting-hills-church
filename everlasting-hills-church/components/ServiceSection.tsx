"use client";

import ScrollReveal from "./ScrollReveal";
import { MapPin, Clock, Navigation, Calendar } from "lucide-react";

// ── Update all service details here ──
const serviceDetails = [
  {
    icon: Clock,
    label: "Service Time",
    value: "Sundays — 9:00 AM", // ← Update this
    sub: "Doors open at 8:30 AM",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Ibadan, Nigeria", // ← Update with specific area
    sub: "Church address coming soon", // ← Replace with actual address
  },
  {
    icon: Calendar,
    label: "Midweek Service",
    value: "Wednesdays — 5:30 PM", // ← Update or remove
    sub: "Bible study & prayer",
  },
];

export default function ServiceSection() {
  return (
    <section id="services" className="py-24 md:py-32 bg-[#FFF4F6]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          {/* Left: Text */}
          <div>
            <ScrollReveal>
              <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3">
                Visit Us
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.08] tracking-tight mb-5 text-balance">
                {/* ── Section heading — edit freely ── */}
                Join us this Sunday
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-[#555] text-base sm:text-lg leading-relaxed mb-8">
                {/* ── Paragraph — edit freely ── */}
                Whether this is your first Sunday or your hundredth, you are
                welcome here. Come expecting to encounter the Word, the Spirit,
                and a family that genuinely cares.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <a
                href="#"
                // ── Replace # with your actual Google Maps link ──
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-all duration-200 hover:shadow-lg hover:shadow-burgundy/25 hover:-translate-y-0.5"
              >
                <Navigation size={15} />
                Get Directions
              </a>
            </ScrollReveal>
          </div>

          {/* Right: Service info cards */}
          <div className="space-y-4">
            {serviceDetails.map((detail, i) => (
              <ScrollReveal key={detail.label} delay={0.15 + i * 0.1} direction="right">
                <div className="flex items-start gap-5 bg-white rounded-2xl p-6 border border-[#E7CDD3]/60 hover:border-[#E7CDD3] hover:shadow-[0_4px_24px_rgba(135,16,44,0.06)] transition-all duration-300">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#FFE8ED] flex items-center justify-center">
                    <detail.icon size={18} className="text-[#87102C]" />
                  </div>
                  {/* Info */}
                  <div>
                    <p className="text-xs text-[#999] tracking-[0.15em] uppercase font-medium mb-0.5">
                      {detail.label}
                    </p>
                    <p className="text-[#111] font-semibold text-base">
                      {detail.value}
                    </p>
                    <p className="text-[#888] text-sm mt-0.5">{detail.sub}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}

            {/* New here note */}
            <ScrollReveal delay={0.45} direction="right">
              <div className="rounded-2xl border border-dashed border-[#E7CDD3] bg-[#FFF4F6] p-6 flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#87102C] flex items-center justify-center">
                  <span className="text-white text-lg leading-none">✦</span>
                </div>
                <div>
                  <p className="text-[#111] font-semibold text-base mb-1">
                    First time visiting?
                  </p>
                  <p className="text-[#666] text-sm leading-relaxed">
                    {/* ── First-time visitor note — edit freely ── */}
                    We'd love to meet you. Come as you are — no dress code, no
                    pressure. Just come expecting something real.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
