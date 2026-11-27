"use client";

import type { ProgramCard } from "@/lib/programs";
import { liveNow, nextStart, whenText } from "./live";
import { usePageNow } from "./now";
import { LiveDot } from "./RhythmStrip";

type Live = Pick<ProgramCard, "occurrences" | "schedule">;

/** When it is next, in words: live, a day and time, or "Date to be announced" / "April. Date to be announced". */
export function whenLine(p: Live, now: Date): string {
  const live = liveNow(p, now);
  if (live.live) return live.session ? `On now: ${live.session}` : "On now";
  const next = nextStart(p, now);
  return next ? whenText(next, now) : p.schedule;
}

/** The Live badge and gold ring, shown only while the program is on. */
export function LiveBadge({ program, now: fixed }: { program: Live; now?: Date }) {
  const now = usePageNow(fixed);
  if (!liveNow(program, now).live) return null;
  return (
    <>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[24px] ring-2 ring-[#C8A04A]/70" />
      <span className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[12px] font-semibold tracking-wide text-[#111] shadow-sm" role="status">
        <LiveDot />
        Live
      </span>
    </>
  );
}

export function WhenText({ program, now: fixed }: { program: Live; now?: Date }) {
  return <>{whenLine(program, usePageNow(fixed))}</>;
}
