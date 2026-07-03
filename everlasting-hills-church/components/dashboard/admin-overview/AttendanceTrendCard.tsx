"use client";

import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import type { AttendancePoint, ServiceTypeKey } from "@/lib/mock/admin-dashboard.mock";

type FilterKey = "ALL" | "SUNDAY" | "WEDNESDAY";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "SUNDAY", label: "Sunday" },
  { key: "WEDNESDAY", label: "Wednesday" },
];

type MetricKey = "value" | "men" | "women" | "children" | "firstTimers";

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "value", label: "Total" },
  { key: "men", label: "Men" },
  { key: "women", label: "Women" },
  { key: "children", label: "Children" },
  { key: "firstTimers", label: "First-timers" },
];

/** How many bars to show after filtering, so the chart stays readable. */
const MAX_BARS = 10;

/**
 * Attendance trend as a clean vertical bar chart with a Sunday/Wednesday filter.
 * Points are tagged with their service type, so admins can compare like-for-like
 * (Sunday-only or Wednesday-only) instead of a mixed line. Dependency-free CSS so
 * bars never distort. Accessible via role="img" + an off-screen value list.
 */
export default function AttendanceTrendCard({
  data,
  ...chrome
}: { data: AttendancePoint[] } & DashboardCardChrome) {
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [metric, setMetric] = useState<MetricKey>("value");

  // Only offer the type filter when the data actually carries service types.
  const hasTypes = useMemo(() => data.some((d) => d.serviceType), [data]);
  // Only offer the category breakdown when the headcount fields are present.
  const hasBreakdown = useMemo(() => data.some((d) => d.men !== undefined), [data]);

  const mv = (d: AttendancePoint) => (metric === "value" ? d.value : d[metric] ?? 0);

  const filtered = useMemo(() => {
    const rows =
      filter === "ALL"
        ? data
        : data.filter((d) => (d.serviceType ?? "SUNDAY") === (filter as ServiceTypeKey));
    return rows.slice(-MAX_BARS);
  }, [data, filter]);

  const max = Math.max(...filtered.map(mv), 1);
  const tickStep = max > 400 ? 100 : max > 40 ? 25 : 5;
  const ceil = Math.max(Math.ceil(max / tickStep) * tickStep, tickStep);
  const ticks = [ceil, ceil * 0.75, ceil * 0.5, ceil * 0.25, 0];

  const first = filtered.length ? mv(filtered[0]) : 0;
  const last = filtered.length ? mv(filtered[filtered.length - 1]) : 0;
  const delta = first ? Math.round(((last - first) / first) * 100) : 0;
  const metricLabel = METRICS.find((m) => m.key === metric)?.label ?? "Total";

  const action = (
    <div className="flex items-center gap-2">
      {hasTypes && (
        <div className="inline-flex rounded-full border border-[#E7CDD3] bg-[#FFF4F6] p-0.5 dark:border-white/10 dark:bg-white/[0.06]">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                filter === f.key
                  ? "bg-[#87102C] text-white shadow-sm dark:bg-[#87102C] dark:text-white"
                  : "text-[#8a7e80] hover:text-[#87102C] dark:text-white/50 dark:hover:text-white"
              }`}
              aria-pressed={filter === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      {filtered.length > 1 && (
        <span className="whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
          {delta >= 0 ? "+" : ""}
          {delta}% vs start
        </span>
      )}
    </div>
  );

  return (
    <DashboardCard kicker="Growth" title="Attendance Trend" icon={BarChart3} action={action} {...chrome}>
      {hasBreakdown && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                metric === m.key
                  ? m.key === "firstTimers"
                    ? "bg-emerald-600 text-white dark:bg-emerald-500"
                    : "bg-[#87102C] text-white"
                  : "bg-[#FFF4F6] text-[#8a7e80] hover:text-[#87102C] dark:bg-white/[0.06] dark:text-white/50 dark:hover:text-white"
              }`}
              aria-pressed={metric === m.key}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-[#E7CDD3]/60 text-sm text-[#8a7e80] dark:border-white/[0.09] dark:text-white/40">
          No {filter === "WEDNESDAY" ? "Wednesday" : filter === "SUNDAY" ? "Sunday" : ""} services recorded yet.
        </div>
      ) : (
        <div className="flex gap-3">
          {/* y-axis */}
          <div className="flex h-48 w-8 flex-col justify-between py-0.5 text-right text-[10px] tabular-nums text-[#8a7e80] dark:text-white/40">
            {ticks.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>

          {/* plot + x-axis share the same flex column so labels align under bars */}
          <div className="min-w-0 flex-1">
            <div className="relative">
              {/* gridlines */}
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                {ticks.map((_, i) => (
                  <div key={i} className="h-px w-full bg-[#E7CDD3]/50 dark:bg-white/[0.07]" />
                ))}
              </div>

              <div
                className="relative flex h-48 items-end justify-between gap-2 sm:gap-3"
                role="img"
                aria-label={`${metricLabel} over the last ${filtered.length} ${
                  filter === "ALL" ? "" : filter.toLowerCase() + " "
                }services, from ${first} to ${last} (${delta >= 0 ? "up" : "down"} ${Math.abs(delta)} percent).`}
              >
                {filtered.map((d, i) => {
                  const isFt = metric === "firstTimers";
                  return (
                    <div key={`${d.label}-${i}`} className="group flex h-full flex-1 items-end justify-center">
                      <div
                        className={`relative w-full max-w-[34px] rounded-t-md transition-opacity hover:opacity-90 ${
                          isFt
                            ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                            : "bg-gradient-to-t from-[#87102C] to-[#c93860] dark:from-[#87102C] dark:to-[#FFB3C1]"
                        }`}
                        style={{ height: `${(mv(d) / ceil) * 100}%` }}
                      >
                        <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-[#111] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-white dark:text-[#111]">
                          {mv(d)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* x-axis labels — same flex shape as the bars */}
            <div className="mt-2 flex justify-between gap-2 text-[10px] text-[#8a7e80] sm:gap-3 dark:text-white/40">
              {filtered.map((d, i) => (
                <span key={`${d.label}-${i}`} className="flex-1 text-center">
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <ul className="sr-only">
        {filtered.map((d, i) => (
          <li key={`${d.label}-${i}`}>{`${d.label}: ${mv(d)} ${metricLabel.toLowerCase()}`}</li>
        ))}
      </ul>
    </DashboardCard>
  );
}
