import Link from "next/link";
import type { ProgramCadence, ProgramCard as Program } from "@/lib/programs";
import { SERIF } from "./accents";
import { ProgramCard } from "./ProgramCard";

const GROUPS: { cadence: ProgramCadence; title: string }[] = [
  { cadence: "WEEKLY", title: "Weekly" },
  { cadence: "MONTHLY", title: "Monthly" },
  { cadence: "ANNUAL", title: "Annual" },
  { cadence: "CUSTOM", title: "Special" },
];

/**
 * The programs grouped by how often they come round, rendered on the server.
 * One staggered CSS entrance (no animation library on this page), skipped
 * when motion is reduced.
 */
export function ProgramGroups({ programs }: { programs: Program[] }) {
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
                <li
                  key={p.slug}
                  className="animate-fade-up motion-reduce:animate-none"
                  style={{ animationDelay: `${0.06 * index++}s`, animationFillMode: "both", animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
                >
                  <ProgramCard program={p} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
