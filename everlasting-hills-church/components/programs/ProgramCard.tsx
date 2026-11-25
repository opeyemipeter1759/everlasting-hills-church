import Link from "next/link";
import type { ProgramCard as Program } from "@/lib/programs";
import { SERIF, TYPE_LABEL } from "./accents";
import { LiveBadge, WhenText } from "./CardLive";
import { Wordmark } from "./Wordmark";

export { whenLine } from "./CardLive";

/**
 * One program on /programs, rendered on the server. Only the Live badge and
 * the "when" line are client pieces, reading the page's shared clock (or the
 * fixed `now` a preview or test gives). The whole card is the link.
 */
export function ProgramCard({ program: p, now }: { program: Program; now?: Date }) {
  const refs = p.scriptures.map((s) => s.reference).join(", ");
  const live = { occurrences: p.occurrences, schedule: p.schedule };
  const footer = [refs, TYPE_LABEL[p.programType]].filter(Boolean);
  return (
    <Link
      href={`/programs/${p.slug}`}
      className="group relative flex h-full flex-col rounded-[24px] bg-white/[0.94] p-2 text-[#111] shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_24px_60px_-28px_rgba(0,0,0,0.8)] ring-1 ring-white/20 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A04A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative">
        <Wordmark program={p} eyebrow={p.eyebrow} heading={p.logoUrl ? undefined : "h3"} />
      </div>
      <LiveBadge program={live} now={now} />
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
          <span aria-hidden="true"> · </span>
          <WhenText program={live} now={now} />
        </p>
      </div>
    </Link>
  );
}
