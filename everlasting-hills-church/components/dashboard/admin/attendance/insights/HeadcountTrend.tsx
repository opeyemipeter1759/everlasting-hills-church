"use client";

import { useState } from "react";
import { Table2 } from "lucide-react";
import type { OverviewService } from "@/lib/api/attendance-roll";
import HeadcountColumns from "./HeadcountColumns";
import { GROUPS, dayMonth } from "../overview/overview-data";
import { trendPoints, trendSummary, type TrendKind } from "./headcount-trend";

const KINDS: { value: TrendKind; label: string }[] = [
  { value: "SUNDAY", label: "Sundays" },
  { value: "WEDNESDAY", label: "Midweek" },
];

/** The ushers' count over recent services, split into men, women and children. */
export default function HeadcountTrend({ services }: { services: OverviewService[] }) {
  const [kind, setKind] = useState<TrendKind>("SUNDAY");
  const [asTable, setAsTable] = useState(false);
  const points = trendPoints(services, kind);
  const summary = trendSummary(points);

  return (
    <section aria-labelledby="headcount-trend-title" className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#1c1c1e]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="headcount-trend-title" className="text-base font-black text-[#1A1210] dark:text-white">Who came</h2>
          <p className="text-xs text-gray-500 dark:text-white/50">The ushers&apos; count of everyone in church, children included</p>
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Services" className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-white/[0.06]">
            {KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                aria-pressed={kind === k.value}
                onClick={() => setKind(k.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  kind === k.value ? "bg-white text-[#1A1210] shadow-sm dark:bg-[#2a2a2e] dark:text-white" : "text-gray-500 hover:text-gray-800 dark:text-white/50"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-pressed={asTable}
            onClick={() => setAsTable((v) => !v)}
            title={asTable ? "Show as a chart" : "Show as a table"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
          >
            <Table2 size={15} />
            <span className="sr-only">{asTable ? "Show as a chart" : "Show as a table"}</span>
          </button>
        </div>
      </div>

      {summary.counted === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-white/15 dark:text-white/50">
          The ushers haven&apos;t counted any of these services yet.
        </p>
      ) : (
        <>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <dt className="text-xs text-gray-500 dark:text-white/50">Average</dt>
              <dd className="text-2xl font-black tabular-nums text-[#1A1210] dark:text-white">{summary.average}</dd>
            </div>
            {summary.highest && (
              <div>
                <dt className="text-xs text-gray-500 dark:text-white/50">Highest, on {dayMonth(summary.highest.date)}</dt>
                <dd className="text-2xl font-black tabular-nums text-[#1A1210] dark:text-white">{summary.highest.total}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-gray-500 dark:text-white/50">Children</dt>
              <dd className="text-2xl font-black tabular-nums text-[#1A1210] dark:text-white">{summary.childrenShare}%</dd>
            </div>
          </dl>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-white/65" aria-label="Key">
            {GROUPS.map((g) => (
              <li key={g.key} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-sm ${g.swatch}`} aria-hidden="true" />
                {g.label}
              </li>
            ))}
          </ul>
          <div className="mt-3">{asTable ? <HeadcountTable points={points} /> : <HeadcountColumns points={points} />}</div>
        </>
      )}
    </section>
  );
}

function HeadcountTable({ points }: { points: OverviewService[] }) {
  const cell = "px-3 py-2 text-right tabular-nums";
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-gray-700 dark:text-white/80">
        <thead className="text-xs text-gray-500 dark:text-white/50">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-semibold">Date</th>
            {["Everyone", ...GROUPS.map((g) => g.label), "First timers"].map((h) => (
              <th key={h} scope="col" className="px-3 py-2 text-right font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.08]">
          {[...points].reverse().map((p) => (
            <tr key={p.id}>
              <th scope="row" className="px-3 py-2 text-left font-semibold">{dayMonth(p.date)}</th>
              {p.headcount ? (
                [p.headcount.total, ...GROUPS.map((g) => p.headcount![g.key]), p.headcount.firstTimers].map((v, i) => <td key={i} className={cell}>{v}</td>)
              ) : (
                <td colSpan={5} className="px-3 py-2 text-right text-gray-400 dark:text-white/40">Not counted</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
