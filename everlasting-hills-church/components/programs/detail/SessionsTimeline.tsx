"use client";

import type { ProgramDetail } from "@/lib/programs";
import { SERIF } from "../accents";
import { liveNow } from "../live";
import { LiveDot } from "../RhythmStrip";
import { useNow } from "../useNow";

const clock = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

/** The parts of each occurrence (the four watches), in order, with the one on now marked. */
export function SessionsTimeline({ program: p, renderedAt }: { program: ProgramDetail; renderedAt: string }) {
  const now = useNow(renderedAt);
  if (!p.sessions.length) return null;
  const current = liveNow(p, now).session;
  return (
    <section aria-labelledby="sessions-heading" className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <h2 id="sessions-heading" className={`${SERIF} text-[28px] text-white`}>
        The watches
      </h2>
      <ol className="mt-6 space-y-3">
        {p.sessions.map((s) => {
          const on = s.name === current;
          return (
            <li
              key={s.name}
              aria-current={on ? "true" : undefined}
              className={`flex items-center justify-between gap-4 rounded-2xl px-4 py-3 ${on ? "bg-white text-[#111]" : "bg-white/[0.04] text-white"}`}
            >
              <span className="flex items-center gap-3">
                {on && <LiveDot />}
                <span className={`${SERIF} text-[21px]`}>{s.name}</span>
                {on && <span className="text-[12px] font-semibold tracking-wide text-[#87102C]">On now</span>}
              </span>
              <span className={`text-[14px] tabular-nums ${on ? "text-brand-muted" : "text-white/65"}`}>
                {clock(s.startTime)} to {clock(s.endTime)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
