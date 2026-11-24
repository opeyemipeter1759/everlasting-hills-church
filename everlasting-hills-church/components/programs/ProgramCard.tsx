import Link from "next/link";
import type { ProgramCard as Program } from "@/lib/programs";
import { SERIF, TYPE_LABEL } from "./accents";
import { liveNow, nextStart, whenText } from "./live";
import { LiveDot } from "./RhythmStrip";
import { Wordmark } from "./Wordmark";

/** When it is next, in words: live, a day and time, or "Date to be announced" / "April. Date to be announced". */
export function whenLine(p: Program, now: Date): string {
  const live = liveNow(p, now);
  if (live.live) return live.session ? `On now: ${live.session}` : "On now";
  const next = nextStart(p, now);
  return next ? whenText(next, now) : p.schedule;
}

/** One program on /programs. The whole card is the link to its page. */
export function ProgramCard({ program: p, now }: { program: Program; now: Date }) {
  const live = liveNow(p, now);
  const refs = p.scriptures.map((s) => s.reference).join(", ");
  const footer = [refs, TYPE_LABEL[p.programType], whenLine(p, now)].filter(Boolean);
  return (
    <Link
      href={`/programs/${p.slug}`}
      className={`group relative flex h-full flex-col rounded-[24px] bg-white/[0.94] p-2 text-[#111] shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_24px_60px_-28px_rgba(0,0,0,0.8)] ring-1 backdrop-blur-xl ${live.live ? "ring-[#C8A04A]/70" : "ring-white/20"} transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A04A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808] motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
    >
      <div className="relative">
        <Wordmark program={p} eyebrow={p.eyebrow} heading={p.logoUrl ? undefined : "h3"} />
        {live.live && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[12px] font-semibold tracking-wide text-[#111] shadow-sm" role="status">
            <LiveDot />
            Live
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-5">
        {p.logoUrl && (
          <>
            <p className="text-[11.5px] font-semibold tracking-[0.12em] text-brand-muted">{p.eyebrow}</p>
            <h3 className={`${SERIF} mt-2 text-[28px] leading-[1.05] text-[#111]`}>{p.name}</h3>
          </>
        )}
        {p.nameStatus === "PROVISIONAL" && <p className="mb-2 text-[12.5px] text-brand-muted">Working name, to be confirmed</p>}
        <p className="line-clamp-3 text-[15px] leading-relaxed text-[#3d3438]">{p.shortDescription}</p>
        <p className="mt-auto pt-5 text-[13px] leading-snug text-brand-muted">
          {footer.map((f, i) => (
            <span key={i}>
              {i > 0 && <span aria-hidden="true"> · </span>}
              <span className={i === 0 && refs ? "text-[#7a5d1a]" : undefined}>{f}</span>
            </span>
          ))}
        </p>
      </div>
    </Link>
  );
}
