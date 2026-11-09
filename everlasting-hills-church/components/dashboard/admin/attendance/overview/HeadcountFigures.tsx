import type { ServiceHeadcountSummary } from "@/lib/api/attendance-roll";
import { GROUPS, change, comparedWith, dayMonth, share } from "./overview-data";

/**
 * Everyone the ushers counted, then the same people split into men, women and
 * children, with a bar showing how the room was made up.
 */
export default function HeadcountFigures({ hc, prev }: { hc: ServiceHeadcountSummary; prev?: { headcount: ServiceHeadcountSummary; date: string } }) {
  const parts = GROUPS.map((g) => ({ ...g, value: hc[g.key], before: prev?.headcount[g.key] }));
  const described = parts.map((p) => `${p.label} ${p.value} (${share(p.value, hc.total)}%)`).join(", ");

  return (
    <div className="mt-3 grid gap-5 sm:grid-cols-[minmax(0,7.5rem)_1fr] sm:items-end">
      <div>
        <p className="text-5xl font-black leading-none tracking-tight tabular-nums text-[#1A1210] dark:text-white">{hc.total}</p>
        <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-white/80">people in church</p>
        {prev && <p className="mt-0.5 text-xs text-gray-500 dark:text-white/50">{comparedWith(hc.total, prev.headcount.total, prev.date)}</p>}
      </div>

      <div>
        <dl className="grid grid-cols-3 gap-3">
          {parts.map((p) => (
            <div key={p.key} className="min-w-0">
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-white/60">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${p.swatch}`} aria-hidden="true" />
                {p.label}
              </dt>
              <dd className="mt-1 text-2xl font-black tabular-nums text-[#1A1210] dark:text-white">{p.value}</dd>
              <dd className="flex flex-wrap gap-x-2 text-xs tabular-nums text-gray-500 dark:text-white/50">
                <span>{share(p.value, hc.total)}%</span>
                {p.before !== undefined && <span title={prev ? `Compared with ${dayMonth(prev.date)}` : undefined}>{change(p.value, p.before)}</span>}
              </dd>
              {p.key === "children" && (
                <dd className="text-xs text-gray-500 dark:text-white/50">
                  {hc.boys} {hc.boys === 1 ? "boy" : "boys"}, {hc.girls} {hc.girls === 1 ? "girl" : "girls"}
                </dd>
              )}
            </div>
          ))}
        </dl>
        <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]" role="img" aria-label={described}>
          {parts.map((p) => (p.value > 0 ? <span key={p.key} className={p.swatch} style={{ flexGrow: p.value }} /> : null))}
        </div>
      </div>
    </div>
  );
}
