import type { Edition, ProgramDetail } from "@/lib/programs";
import { SERIF } from "../accents";

const range = (e: Edition) => {
  if (e.dateStatus === "TBA" || !e.startsOn || !e.endsOn) return "Dates to be announced";
  const f = (d: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts }).format(new Date(`${d}T00:00:00Z`));
  return `${f(e.startsOn, { day: "numeric" })} to ${f(e.endsOn, { day: "numeric", month: "long", year: "numeric" })}`;
};

/** An annual program's editions: the next one first, then the archive (Furnace '26, Dominion). */
export function EditionsPanel({ program: p }: { program: ProgramDetail }) {
  const { upcoming, archive } = p.editions;
  if (!upcoming.length && !archive.length) return null;
  return (
    <section aria-labelledby="editions-heading">
      <h2 id="editions-heading" className={`${SERIF} text-[28px] text-white`}>
        Editions
      </h2>
      {upcoming.map((e) => (
        <article key={e.label} className="mt-6 rounded-[24px] bg-white/[0.94] p-6 text-[#111] sm:p-8">
          <p className="text-[13px] font-semibold text-[#87102C]">Next</p>
          <h3 className={`${SERIF} mt-1 text-[30px]`}>{e.label}</h3>
          {e.theme && <p className="mt-1 text-[16px] text-[#3d3438]">Theme: {e.theme}</p>}
          <p className="mt-3 text-[15px] text-brand-muted">{range(e)}</p>
          {e.summary && <p className="mt-4 text-[15px] leading-relaxed text-[#3d3438]">{e.summary}</p>}
        </article>
      ))}
      {archive.length > 0 && (
        <>
          <h3 className="mt-10 text-[14px] font-medium text-white/60">Past editions</h3>
          <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
            {archive.map((e) => (
              <li key={e.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4">
                <span className="text-white">
                  <span className={`${SERIF} text-[21px]`}>{e.label}</span>
                  {e.theme && <span className="ml-2 text-white/70">{e.theme}</span>}
                </span>
                <span className="text-[14px] text-white/55">
                  {range(e)}
                  {e.recordingUrl && (
                    <a href={e.recordingUrl} target="_blank" rel="noopener noreferrer" className="ml-3 text-white underline underline-offset-4">
                      Watch again
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
