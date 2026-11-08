"use client";

import { useState } from "react";
import { Crown, TriangleAlert } from "lucide-react";
import type { OverviewSlot } from "@/lib/api/prayer-watch-overview";
import { longDate, panel, panelHint, panelTitle, plural } from "./format";

const PLOT_HEIGHT = 160;

function Tooltip({ s }: { s: OverviewSlot }) {
  return (
    <div role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-3 text-left text-xs shadow-lg dark:border-white/10 dark:bg-[#22171A]">
      <p className="font-bold text-[#1A1210] dark:text-white">
        {s.label}, {s.startTime}–{s.endTime}
      </p>
      <p className="mt-1 text-gray-600 dark:text-white/70">
        {plural(s.confirmed, "person", "people")} of {s.capacity} spots
      </p>
      <p className="text-gray-600 dark:text-white/70">{plural(s.workers, "worker")} among them</p>
      {s.pending > 0 && <p className="text-gray-600 dark:text-white/70">{plural(s.pending, "sign-up")} waiting</p>}
      <p className="mt-1 text-gray-600 dark:text-white/70">
        {s.leaderName ? `Led by ${s.leaderName}${s.leaderTermEndsAt ? ` until ${longDate(s.leaderTermEndsAt)}` : ""}` : "No leader yet"}
      </p>
      <p className="text-gray-600 dark:text-white/70">{s.whatsappLinkSet ? "Family WhatsApp group linked" : "No family WhatsApp group linked"}</p>
    </div>
  );
}

/** People on each watch through the night, with who leads it. */
export default function WatchCoverage({ slots }: { slots: OverviewSlot[] }) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(1, ...slots.map((s) => s.confirmed));

  return (
    <section className={panel} aria-labelledby="coverage-title">
      <h2 id="coverage-title" className={panelTitle}>
        Through the night
      </h2>
      <p className={panelHint}>People on each watch, from 10pm to 6am. Hover a watch for details.</p>

      <div className="mt-6 grid grid-cols-4 gap-2" style={{ height: PLOT_HEIGHT }} aria-hidden="true">
        {slots.map((s) => {
          const h = s.confirmed === 0 ? 0 : Math.max(6, Math.round((s.confirmed / max) * (PLOT_HEIGHT - 24)));
          return (
            <div
              key={s.id}
              className="relative flex flex-col items-center justify-end"
              onMouseEnter={() => setActive(s.id)}
              onMouseLeave={() => setActive(null)}
            >
              {active === s.id && <Tooltip s={s} />}
              <span className="mb-1 text-sm font-semibold text-[#1A1210] dark:text-white">{s.confirmed}</span>
              <span className="w-6 rounded-t bg-[#87102C] dark:bg-[#E8768A]" style={{ height: h }} />
            </div>
          );
        })}
      </div>

      {/* Dusk to dawn: the watch's own colours along the night it covers. */}
      <div className="h-1.5 rounded-full bg-gradient-to-r from-[#4F2E5E] via-[#232C52] to-[#C97A3E]" aria-hidden="true" />
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-gray-500 dark:text-white/50" aria-hidden="true">
        {[...slots.map((s) => s.startTime), slots[slots.length - 1]?.endTime].map((t, i) => (
          <span key={`${t}-${i}`}>{t}</span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {slots.map((s) => (
          <button
            key={s.id}
            type="button"
            onMouseEnter={() => setActive(s.id)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(s.id)}
            onBlur={() => setActive(null)}
            aria-label={`${s.label}, ${s.startTime} to ${s.endTime}: ${plural(s.confirmed, "person", "people")}, ${s.leaderName ? `led by ${s.leaderName}` : "no leader yet"}`}
            className="flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-center hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C] dark:hover:bg-white/5"
          >
            <span className="w-full truncate text-xs font-semibold text-[#1A1210] dark:text-white">{s.label}</span>
            {s.leaderName ? (
              <span className="flex w-full items-center justify-center gap-1 truncate text-[11px] text-gray-500 dark:text-white/55">
                <Crown size={11} className="flex-shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
                <span className="truncate">{s.leaderName.split(" ")[0]}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                <TriangleAlert size={11} aria-hidden="true" /> No leader
              </span>
            )}
          </button>
        ))}
      </div>

      <table className="sr-only">
        <caption>People on each Prayer Watch</caption>
        <thead>
          <tr>
            <th>Watch</th>
            <th>Time</th>
            <th>People</th>
            <th>Leader</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((s) => (
            <tr key={s.id}>
              <td>{s.label}</td>
              <td>
                {s.startTime}–{s.endTime}
              </td>
              <td>{s.confirmed}</td>
              <td>{s.leaderName ?? "None"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
