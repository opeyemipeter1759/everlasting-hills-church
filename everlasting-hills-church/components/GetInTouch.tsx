"use client";

import ScrollReveal from "./ScrollReveal";

export default function GetInTouch() {
  return (
    <div className="text-center max-w-2xl mx-auto mb-16">
      <ScrollReveal>
        <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3">
          Get in Touch
        </p>
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.1] tracking-tight text-balance">
          We&rsquo;d love to hear from you
        </h2>
      </ScrollReveal>
      <ScrollReveal delay={0.2}>
        <p className="mt-4 text-[#555] text-base sm:text-lg leading-relaxed">
          Have a question, need prayer, or just want to connect? Reach out —
          we are here.
        </p>
      </ScrollReveal>
    </div>
  );
}
