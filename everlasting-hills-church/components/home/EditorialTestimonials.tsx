"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Testimonial } from "@/data/testimonials";

const EASE = [0.22, 1, 0.36, 1] as const;
const LONG_THRESHOLD = 380; // characters before a story gets a Read more toggle
const COLLAPSED_HEIGHT = 168; // ~6 lines at 1.7 line-height

/**
 * Editorial "Member stories" — balanced CSS columns (text simply flows, no fixed
 * card heights), each story scroll-reveals, and long stories collapse behind an
 * accessible Read more toggle. Restraint is the point: no avatars, cards, or slider.
 */
export default function EditorialTestimonials({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  return (
    <div
      role="region"
      aria-label="Member stories"
      className="mx-auto max-w-[1100px] columns-1 gap-x-16 lg:columns-2"
    >
      {testimonials.map((t, i) => (
        <Story key={t.id} testimonial={t} index={i} />
      ))}
    </div>
  );
}

function Story({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  const reduce = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();

  const isLong = testimonial.body.length > LONG_THRESHOLD;
  const paragraphs = testimonial.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const reveal = reduce
    ? { initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { duration: 0.5 } }
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        transition: { duration: 0.65, ease: EASE, delay: (index % 2) * 0.1 },
      };

  return (
    <motion.article
      {...reveal}
      viewport={{ once: true, margin: "-60px" }}
      className="mb-12 break-inside-avoid border-b border-[#E7CDD3]/50 pb-12 last:border-0"
    >
      <h3 className="font-serif text-[clamp(1.5rem,1.1rem+1.4vw,2rem)] font-bold leading-tight text-[#87102C]">
        {testimonial.title}
      </h3>

      <motion.div
        id={bodyId}
        initial={false}
        animate={{ height: !isLong || expanded ? "auto" : COLLAPSED_HEIGHT }}
        transition={reduce ? { duration: 0 } : { duration: 0.45, ease: EASE }}
        className="relative mt-4 overflow-hidden"
      >
        <div className="space-y-4 text-[1.0625rem] leading-[1.7] text-[#080808]/80">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {isLong && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FBEAF0] to-transparent" />
        )}
      </motion.div>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={bodyId}
          className="mt-3 rounded text-sm font-semibold text-[#87102C] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}

      <p className="mt-6 flex items-center gap-2.5 text-sm font-bold text-[#080808]/65">
        <span aria-hidden="true" className="h-px w-6 bg-[#87102C]" />
        {testimonial.author}
      </p>
    </motion.article>
  );
}
