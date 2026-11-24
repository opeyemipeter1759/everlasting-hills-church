import { calendarHref, type ProgramDetail } from "@/lib/programs";
import { SERIF } from "../accents";
import { clockLagos, dateLagos } from "../live";

/** When it happens: the rule in words, the next three dates in Lagos time, and Add to calendar. */
export function SchedulePanel({ program: p }: { program: ProgramDetail }) {
  const next = p.occurrences.slice(0, 3);
  return (
    <section aria-labelledby="schedule-heading" className="rounded-[24px] bg-white/[0.94] p-6 text-[#111] sm:p-8">
      <h2 id="schedule-heading" className={`${SERIF} text-[28px]`}>
        When
      </h2>
      <p className="mt-3 text-[17px] leading-relaxed text-[#3d3438]">{p.schedule}</p>
      {next.length > 0 ? (
        <>
          <ul className="mt-6 divide-y divide-[#E7CDD3]/70 border-y border-[#E7CDD3]/70">
            {next.map((o) => {
              const start = new Date(o.start);
              return (
                <li key={o.start} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                  <span className="text-[15px] font-medium">{dateLagos(start, true)}</span>
                  <span className="text-[14px] text-brand-muted">
                    {o.label ? `${o.label} · ` : ""}from {clockLagos(start)} WAT
                  </span>
                </li>
              );
            })}
          </ul>
          <a
            href={calendarHref(p.slug)}
            className="mt-6 inline-flex rounded-full border border-[#E7CDD3] px-5 py-2.5 text-[14px] font-semibold text-[#87102C] transition-colors hover:bg-[#FBEAF0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]"
          >
            Add to calendar
          </a>
        </>
      ) : (
        <p className="mt-4 text-[15px] text-brand-muted">We will publish the dates here as soon as they are confirmed.</p>
      )}
      {p.venue && <p className="mt-6 text-[14px] text-brand-muted">Where: {p.venue}</p>}
    </section>
  );
}
