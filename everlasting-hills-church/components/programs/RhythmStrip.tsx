"use client";

import Link from "next/link";
import { BRAND } from "./accents";
import { byRhythm, rhythmLine, type RhythmItem } from "./live";
import { usePageNow } from "./now";

/**
 * "The rhythm of the house": what is on now and what is next across every
 * program, in one band. Live programs first, then the soonest. Recomputed
 * every minute (the page's shared clock) from the server's windows, so it is
 * right whenever you look.
 */
export function RhythmStrip({ programs }: { programs: RhythmItem[] }) {
  const now = usePageNow();
  if (!programs.length) return null;
  const items = byRhythm(programs, now).map((p) => ({ p, line: rhythmLine(p, now) }));
  return (
    <section aria-labelledby="rhythm-heading" className="border-y border-white/10 bg-white/[0.03]">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <h2 id="rhythm-heading" className="text-[13px] font-medium text-white/60">
          The rhythm of the house
        </h2>
        <ul className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {items.map(({ p, line }) => (
            <li key={p.slug} className="shrink-0">
              <Link
                href={`/programs/${p.slug}`}
                className={`flex items-center gap-2.5 rounded-full border px-4 py-2 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                  line.live ? "border-white/25 bg-white text-[#111]" : "border-white/12 text-white/85 hover:bg-white/[0.06]"
                }`}
              >
                {line.live && <LiveDot />}
                {line.text}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** A small burgundy dot with a gold ring that breathes; still when motion is reduced. */
export function LiveDot() {
  return (
    <span aria-hidden="true" className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none" style={{ background: BRAND.gold }} />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: BRAND.burgundy, boxShadow: `0 0 0 2px ${BRAND.gold}55` }} />
    </span>
  );
}
