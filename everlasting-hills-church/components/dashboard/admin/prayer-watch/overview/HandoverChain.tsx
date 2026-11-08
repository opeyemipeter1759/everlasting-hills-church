"use client";

import { Fragment, useState } from "react";
import { Sunrise, Users } from "lucide-react";
import type { ChainWatch, OverviewSlot, ReportsSummary } from "@/lib/api/prayer-watch-overview";
import { durationLong, durationShort, nightShort } from "@/lib/prayer-watch-nights";
import { panel, panelHint, panelTitle, plural } from "./format";

const cellBase = "flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center rounded-lg border px-1 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C]";
const cellStyle: Record<ChainWatch["status"], string> = {
  reported: "border-[#87102C]/30 bg-[#FBE7EB] text-[#1A1210] dark:border-[#E8768A]/40 dark:bg-[#E8768A]/15 dark:text-white",
  missing: "border-dashed border-gray-400 text-gray-600 dark:border-white/35 dark:text-white/65",
  "not-yet": "border-dotted border-gray-300 text-gray-400 dark:border-white/15 dark:text-white/35",
};

function describe(slot: OverviewSlot, night: string, w: ChainWatch, last: boolean): string {
  const where = `${slot.label}, ${nightShort(night)}`;
  if (w.status === "missing") return `${where}: no report came in.`;
  if (w.status === "not-yet") return `${where}: not reported yet.`;
  const handover = w.handedOver ? (last ? "Closed the night." : `Handed over${w.handedOverTo ? ` to ${w.handedOverTo}` : ""}.`) : "No handover recorded.";
  return `${where}: ${durationLong(w.minutes)}, ${plural(w.people, "person", "people")} prayed. ${handover}`;
}

/** The last week of nights as a chain of watches: each link is a handover the leaders reported. */
export default function HandoverChain({ reports, slots }: { reports: ReportsSummary | null; slots: OverviewSlot[] }) {
  const [active, setActive] = useState<{ night: string; i: number } | null>(null);
  if (!reports || reports.chain.length === 0) return null;

  const picked = active && reports.chain.find((c) => c.night === active.night)?.watches[active.i];

  return (
    <section className={panel} aria-labelledby="chain-title">
      <h2 id="chain-title" className={panelTitle}>
        The handover, night by night
      </h2>
      <p className={panelHint}>Each watch passing to the next, as its leader reported it.</p>

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 pl-[52px] text-[11px] font-medium text-gray-500 dark:text-white/50" aria-hidden="true">
          {slots.map((s, i) => (
            <Fragment key={s.id}>
              {i > 0 && <span className="w-3 flex-shrink-0" />}
              <span className="min-w-0 flex-1 truncate text-center">{s.label.replace(/\s*Watch$/, "")}</span>
            </Fragment>
          ))}
        </div>
        {reports.chain.map(({ night, watches }) => (
          <div key={night} className="flex items-center gap-1.5">
            <span className="w-[46px] flex-shrink-0 text-xs font-medium tabular-nums text-gray-600 dark:text-white/65">{nightShort(night).replace(/\s\w+$/, "")}</span>
            {watches.map((w, i) => {
              const slot = slots.find((s) => s.id === w.slotId);
              if (!slot) return null;
              const last = i === watches.length - 1;
              const prev = watches[i - 1];
              return (
                <Fragment key={w.slotId}>
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className={`w-3 flex-shrink-0 border-t-2 ${prev.status === "reported" && prev.handedOver ? "border-[#87102C] dark:border-[#E8768A]" : "border-dashed border-gray-300 dark:border-white/20"}`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setActive({ night, i })}
                    aria-label={describe(slot, night, w, last)}
                    aria-pressed={active?.night === night && active.i === i}
                    className={`${cellBase} ${cellStyle[w.status]} ${active?.night === night && active.i === i ? "ring-2 ring-[#87102C] dark:ring-[#E8768A]" : ""}`}
                  >
                    {w.status === "reported" ? (
                      <>
                        <span className="flex items-center gap-0.5 text-sm font-semibold tabular-nums">
                          {durationShort(w.minutes)}
                          {last && w.handedOver && <Sunrise size={12} aria-hidden="true" />}
                        </span>
                        <span className="flex items-center gap-0.5 text-[11px] tabular-nums opacity-75">
                          <Users size={10} aria-hidden="true" />
                          {w.people}
                          <span className="hidden sm:inline">prayed</span>
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] leading-tight">{w.status === "missing" ? "No report" : "Not yet"}</span>
                    )}
                  </button>
                </Fragment>
              );
            })}
          </div>
        ))}
      </div>

      <p className="mt-3 min-h-[2.5rem] text-sm text-[#1A1210] dark:text-white/85" aria-live="polite">
        {picked && active ? (
          <>
            {describe(slots.find((s) => s.id === picked.slotId)!, active.night, picked, active.i === slots.length - 1)}
            {picked.notes && <span className="mt-1 block text-gray-600 dark:text-white/65">&ldquo;{picked.notes}&rdquo;</span>}
          </>
        ) : (
          <span className="text-gray-500 dark:text-white/50">Tap a watch to see its report.</span>
        )}
      </p>
      <p className="mt-2 text-xs text-gray-500 dark:text-white/50">
        A solid link means the handover was confirmed; a broken one means it wasn&apos;t. Dashed boxes are reports that never came in.
      </p>
    </section>
  );
}
