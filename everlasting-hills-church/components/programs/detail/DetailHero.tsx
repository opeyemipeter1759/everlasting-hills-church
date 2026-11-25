import Link from "next/link";
import { calendarHref, type ProgramDetail } from "@/lib/programs";
import { SERIF } from "../accents";
import { Wordmark } from "../Wordmark";

const button =
  "inline-flex items-center justify-center rounded-full px-6 py-3 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A04A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808]";

/** The top of a program's page: its cover, name, rhythm and the one thing to do next. */
export function DetailHero({ program: p }: { program: ProgramDetail }) {
  const dated = p.occurrences.length > 0;
  return (
    <header className="px-4 pb-12 pt-28 sm:px-6 sm:pt-36">
      <div className="mx-auto max-w-6xl">
        <Link href="/programs" className="text-[14px] text-white/60 hover:text-white focus-visible:outline-none focus-visible:underline">
          All programs
        </Link>
        <div className="mt-6 grid items-end gap-8 lg:grid-cols-[1.1fr_1fr]">
          <Wordmark program={p} size="hero" eyebrow={p.eyebrow} heading={p.logoUrl ? undefined : "h1"} />
          <div>
            {p.logoUrl && (
              <>
                <p className="text-[12px] font-semibold tracking-[0.12em] text-white/60">{p.eyebrow}</p>
                <h1 className={`${SERIF} mt-3 text-[46px] leading-[1.02] tracking-[-0.01em] text-white sm:text-[64px]`}>{p.name}</h1>
              </>
            )}
            {p.nameStatus === "PROVISIONAL" && <p className="mb-3 text-[13px] text-white/55">Working name, to be confirmed.</p>}
            <p className="max-w-xl text-[18px] leading-relaxed text-white/80">{p.shortDescription}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {p.ctaLabel && p.ctaUrl && (
                <Link href={p.ctaUrl} className={`${button} bg-[#87102C] text-white hover:bg-[#6E0C24]`}>
                  {p.ctaLabel}
                </Link>
              )}
              {p.streamUrl && (
                <a href={p.streamUrl} target="_blank" rel="noopener noreferrer" className={`${button} border border-white/25 text-white hover:bg-white/10`}>
                  Watch the stream
                </a>
              )}
              {dated && (
                <a href={calendarHref(p.slug)} className={`${button} border border-white/25 text-white hover:bg-white/10`}>
                  Add to calendar
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
