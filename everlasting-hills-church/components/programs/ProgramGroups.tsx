"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ProgramCadence, ProgramCard as Program } from "@/lib/programs";
import { EASE, SERIF } from "./accents";
import { ProgramCard } from "./ProgramCard";
import { useNow } from "./useNow";

const GROUPS: { cadence: ProgramCadence; title: string }[] = [
  { cadence: "WEEKLY", title: "Weekly" },
  { cadence: "MONTHLY", title: "Monthly" },
  { cadence: "ANNUAL", title: "Annual" },
  { cadence: "CUSTOM", title: "Special" },
];

/** The programs grouped by how often they come round. One staggered entrance, nothing after it. */
export function ProgramGroups({ programs, renderedAt }: { programs: Program[]; renderedAt: string }) {
  const now = useNow(renderedAt);
  const still = useReducedMotion();
  if (!programs.length) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-10 text-center">
          <p className={`${SERIF} text-[28px] text-white`}>No programs are published yet</p>
          <p className="mt-3 text-white/70">
            They will appear here as soon as the pastors publish them. In the meantime, see what is coming up at{" "}
            <Link href="/events" className="text-white underline underline-offset-4">
              Events
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }
  let index = 0;
  return (
    <div className="mx-auto max-w-6xl divide-y divide-white/10 px-4 py-6 sm:px-6 sm:py-10">
      {GROUPS.map(({ cadence, title }) => {
        const items = programs.filter((p) => p.cadence === cadence);
        if (!items.length) return null;
        return (
          <section key={cadence} aria-labelledby={`group-${cadence}`} className="grid gap-6 py-10 lg:grid-cols-[200px_1fr] lg:gap-10 lg:py-14">
            <h2 id={`group-${cadence}`} className={`${SERIF} text-[30px] leading-none text-white sm:text-[36px] lg:pt-2`}>
              {title}
            </h2>
            <ul className="grid gap-5 sm:grid-cols-2">
              {items.map((p) => (
                <motion.li
                  key={p.slug}
                  initial={still ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: EASE, delay: still ? 0 : 0.06 * index++ }}
                >
                  <ProgramCard program={p} now={now} />
                </motion.li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
