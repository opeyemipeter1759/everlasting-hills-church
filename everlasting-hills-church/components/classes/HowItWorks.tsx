"use client";

import { useEffect, useRef, useState } from "react";
import { EmphasisHeading } from "./theme";
import { MEMBERSHIP_WEEKS } from "./membership-content";

const PARTS = [
  { id: "format", label: "Format" },
  { id: "duration", label: "Duration" },
  { id: "completion", label: "Completion" },
] as const;

/**
 * "How it works": the heading and a small index stay pinned on the left while
 * the three parts flow past on the right. The index follows whichever part is
 * in view. On phones it is simply a heading above the parts.
 */
export default function HowItWorks() {
  const [active, setActive] = useState<string>(PARTS[0].id);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id.replace("how-", ""));
      },
      // The band across the middle of the screen: a part is "current" when it crosses it.
      { rootMargin: "-40% 0px -45% 0px" },
    );
    for (const p of PARTS) {
      const el = refs.current[p.id];
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  const part = (id: string) => ({
    id: `how-${id}`,
    ref: (el: HTMLElement | null) => {
      refs.current[id] = el;
    },
  });

  return (
    <section id="how-it-works" className="bg-white px-4 py-20 sm:py-28 text-[var(--color-ink)]">
      <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <EmphasisHeading before="How it" emphasis="works" className="text-5xl sm:text-6xl" />
          <span aria-hidden="true" className="mt-6 block h-1 w-14 rounded-full bg-[var(--color-burgundy)]" />
          <ul className="mt-10 hidden space-y-1 lg:block" aria-label="On this section">
            {PARTS.map((p) => {
              const on = active === p.id;
              return (
                <li key={p.id}>
                  <a
                    href={`#how-${p.id}`}
                    aria-current={on ? "true" : undefined}
                    className={`flex items-center gap-3 rounded-lg py-2 text-lg transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-burgundy)] ${
                      on ? "text-[var(--color-ink)]" : "text-black/40 hover:text-black/70"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-px transition-all duration-500 ${on ? "w-10 bg-[var(--color-burgundy)]" : "w-5 bg-black/25"}`}
                    />
                    {p.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="divide-y divide-[var(--color-pink-border)] border-y border-[var(--color-pink-border)]">
          <article {...part("format")} className="scroll-mt-28 py-10 lg:min-h-[42vh] lg:py-16">
            <h3 className="cls-display text-3xl text-[var(--color-burgundy)] sm:text-4xl">Format</h3>
            <p className="mt-5 max-w-[34rem] text-xl leading-relaxed text-black/70">
              Each week, a recorded class video is posted on your member dashboard. Watch it to the end and write a
              short summary of what you learnt. Then join us for a 45-minute session after the Sunday service.
            </p>
          </article>

          <article {...part("duration")} className="scroll-mt-28 py-10 lg:min-h-[42vh] lg:py-16">
            <h3 className="cls-display text-3xl text-[var(--color-burgundy)] sm:text-4xl">Duration</h3>
            <p className="mt-5 max-w-[34rem] text-xl leading-relaxed text-black/70">Four weeks, recurring.</p>
            <div aria-hidden="true" className="mt-6 grid max-w-sm grid-cols-4 gap-2">
              {MEMBERSHIP_WEEKS.map((w) => (
                <span
                  key={w.number}
                  className="rounded-full bg-[var(--color-chip)] py-1.5 text-center text-xs font-semibold tabular-nums text-[var(--color-burgundy)]"
                >
                  Week {w.number}
                </span>
              ))}
            </div>
          </article>

          <article {...part("completion")} className="scroll-mt-28 py-10 lg:min-h-[42vh] lg:py-16">
            <h3 className="cls-display text-3xl text-[var(--color-burgundy)] sm:text-4xl">Completion</h3>
            <p className="mt-5 max-w-[34rem] text-xl leading-relaxed text-black/70">
              Watch all the videos, submit your summaries and attend the sessions to be recognised as a member of EHC.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
