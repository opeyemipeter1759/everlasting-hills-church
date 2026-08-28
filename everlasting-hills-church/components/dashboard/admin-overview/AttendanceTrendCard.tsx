"use client";

import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import type { AttendancePoint, ServiceTypeKey } from "@/lib/types/admin-dashboard";

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

type RangeKey = "3M" | "6M" | "1Y" | "ALL";

const RANGES: { key: RangeKey; label: string; months: number | null }[] = [
  { key: "3M", label: "3M", months: 3 },
  { key: "6M", label: "6M", months: 6 },
  { key: "1Y", label: "1Y", months: 12 },
  { key: "ALL", label: "All", months: null },
];

/**
 * Bars are coloured by which service they are, not by recency.
 *
 * The chart pairs a week's services side by side, so the colour is what tells
 * you which bar is which — the same job the legend does in any grouped bar
 * chart. SPECIAL covers watchnights and one-off gatherings; they keep their own
 * colour rather than being hidden, because they are real counts.
 */
const SERIES: { key: ServiceTypeKey; label: string; color: string }[] = [
  { key: "SUNDAY", label: "Sunday", color: "#87102C" },
  { key: "WEDNESDAY", label: "Wednesday", color: "#C9973F" },
  { key: "SPECIAL", label: "Special", color: "#64748b" },
];

const SERIES_COLOR: Record<string, string> = Object.fromEntries(
  SERIES.map((s) => [s.key, s.color]),
);

/**
 * The WAT calendar day a timestamp falls on, as yyyy-mm-dd.
 *
 * Services are not all stored the same way: some carry a real service time
 * (Sunday 08:00Z), others were created at WAT midnight and so sit at 23:00Z on
 * the day BEFORE. Slicing the ISO string would call those the previous day —
 * which for a Sunday means the previous week, and the whole point of this chart
 * is that a week's Wednesday and Sunday stand together.
 */
const WAT_OFFSET_MS = 60 * 60 * 1000;

function watDay(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso.slice(0, 10);
  return new Date(at.getTime() + WAT_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Monday of the week a service falls in, as a sortable yyyy-mm-dd key.
 *
 * All UTC methods on a UTC-parsed date. Doing this in local time round-trips the
 * key through the viewer's offset and lands a day early, so the same week would
 * be labelled differently depending on who is looking at it.
 */
function weekStart(iso: string): string {
  const at = new Date(watDay(iso) + "T00:00:00Z");
  if (Number.isNaN(at.getTime())) return iso.slice(0, 10);
  // getUTCDay(): 0 = Sunday. Shifting to a Monday start is what puts a
  // Wednesday service and the Sunday that follows it in the same group — the
  // pairing the church actually thinks in.
  const offset = (at.getUTCDay() + 6) % 7;
  at.setUTCDate(at.getUTCDate() - offset);
  return at.toISOString().slice(0, 10);
}

/** Week keys are already plain yyyy-mm-dd, so this takes them as-is. */
function shortDate(dayKey: string): string {
  const at = new Date(dayKey + "T00:00:00Z");
  if (Number.isNaN(at.getTime())) return dayKey;
  return `${String(at.getUTCDate()).padStart(2, "0")}/${String(at.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Tooltip date for a service timestamp, read in WAT. */
function fullDate(iso: string): string {
  const at = new Date(watDay(iso) + "T00:00:00Z");
  if (Number.isNaN(at.getTime())) return iso;
  return at.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

interface WeekGroup {
  key: string;
  label: string;
  points: AttendancePoint[];
}

/** Widths step down as more weeks fit on screen, so the chart never turns into a wall. */
function barMaxWidth(groups: number, perGroup: number): number {
  const bars = Math.max(groups * perGroup, 1);
  if (bars <= 8) return 34;
  if (bars <= 16) return 26;
  if (bars <= 30) return 18;
  if (bars <= 60) return 11;
  return 7;
}

function labelStride(groups: number): number {
  if (groups <= 14) return 1;
  if (groups <= 28) return 2;
  if (groups <= 60) return 4;
  return Math.ceil(groups / 14);
}

export default function AttendanceTrendCard({
  data,
  ...chrome
}: { data: AttendancePoint[] } & DashboardCardChrome) {
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [metric, setMetric] = useState<MetricKey>("value");
  const [range, setRange] = useState<RangeKey>("3M");

  const hasTypes = useMemo(() => data.some((d) => d.serviceType), [data]);
  const hasBreakdown = useMemo(() => data.some((d) => d.men !== undefined), [data]);

  const mv = (d: AttendancePoint) => (metric === "value" ? d.value : d[metric] ?? 0);

  const points = useMemo(() => {
    const byType =
      filter === "ALL"
        ? data
        : data.filter((d) => (d.serviceType ?? "SUNDAY") === (filter as ServiceTypeKey));

    const months = RANGES.find((r) => r.key === range)?.months ?? null;
    if (months === null) return byType;

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return byType.filter((d) => {
      if (!d.date) return true;
      const at = new Date(watDay(d.date) + "T00:00:00Z");
      return Number.isNaN(at.getTime()) || at >= cutoff;
    });
  }, [data, filter, range]);

  /**
   * One column per week, holding that week's services in calendar order. This is
   * the shape the church reads attendance in — "how did we do this week" — and
   * it puts Wednesday next to the Sunday it belongs with instead of scattering
   * them along a single row where the alternation reads as a sawtooth.
   */
  const groups = useMemo<WeekGroup[]>(() => {
    // A plain record rather than a Map: this file compiles against an ES5
    // target, where spreading a Map iterator needs downlevelIteration.
    const byWeek: Record<string, AttendancePoint[]> = {};
    for (const point of points) {
      const key = weekStart(point.date ?? "");
      if (byWeek[key]) byWeek[key].push(point);
      else byWeek[key] = [point];
    }
    // yyyy-mm-dd sorts chronologically as a string.
    return Object.keys(byWeek)
      .sort()
      .map((key) => ({
        key,
        label: shortDate(key),
        // Calendar order within the week, read in WAT for the same reason the
        // grouping is: a 23:00Z timestamp belongs to the next day here.
        points: byWeek[key]
          .slice()
          .sort((a, b) => watDay(a.date ?? "").localeCompare(watDay(b.date ?? ""))),
      }));
  }, [points]);

  const perGroup = Math.max(...groups.map((g) => g.points.length), 1);
  const maxWidth = barMaxWidth(groups.length, perGroup);
  const stride = labelStride(groups.length);

  const max = Math.max(...points.map(mv), 1);
  const tickStep = max > 400 ? 100 : max > 40 ? 25 : 5;
  const ceil = Math.max(Math.ceil(max / tickStep) * tickStep, tickStep);
  const ticks = [ceil, ceil * 0.75, ceil * 0.5, ceil * 0.25, 0];

  const first = points.length ? mv(points[0]) : 0;
  const last = points.length ? mv(points[points.length - 1]) : 0;
  const delta = first ? Math.round(((last - first) / first) * 100) : 0;
  const metricLabel = METRICS.find((m) => m.key === metric)?.label ?? "Total";

  // Only the series actually present get a legend entry, so a Sunday-only filter
  // does not advertise a Wednesday colour that is nowhere on the chart.
  const activeSeries = SERIES.filter((s) =>
    points.some((p) => (p.serviceType ?? "SUNDAY") === s.key),
  );

  const action = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.05] p-0.5">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
              range === r.key
                ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900"
                : "text-gray-400 hover:text-gray-700 dark:text-white/40 dark:hover:text-white"
            }`}
            aria-pressed={range === r.key}
          >
            {r.label}
          </button>
        ))}
      </div>
      {hasTypes && (
        <div className="inline-flex rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.05] p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                filter === f.key
                  ? "bg-[#87102C] text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-700 dark:text-white/40 dark:hover:text-white"
              }`}
              aria-pressed={filter === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      {points.length > 1 && (
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${
            delta >= 0
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400"
          }`}
        >
          {delta >= 0 ? "+" : ""}
          {delta}% vs start
        </span>
      )}
    </div>
  );

  return (
    <DashboardCard kicker="Growth" title="Attendance Trend" icon={BarChart3} action={action} {...chrome}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        {/* Legend — which colour is which service */}
        <div className="flex flex-wrap items-center gap-4">
          {activeSeries.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-white/50">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>

        {hasBreakdown && (
          <div className="flex flex-wrap items-center gap-1.5">
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMetric(m.key)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  metric === m.key
                    ? "border-transparent bg-[#87102C] text-white shadow-sm"
                    : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white"
                }`}
                aria-pressed={metric === m.key}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-white/[0.09] text-sm text-gray-400 dark:text-white/40">
          No {filter === "WEDNESDAY" ? "Wednesday" : filter === "SUNDAY" ? "Sunday" : ""} services
          {range === "ALL" ? " recorded yet." : ` in the last ${RANGES.find((r) => r.key === range)?.label}.`}
        </div>
      ) : (
        <div className="flex gap-3">
          {/* y-axis */}
          <div className="flex h-52 w-10 flex-col justify-between py-0.5 text-right text-[10px] tabular-nums text-gray-400 dark:text-white/30">
            {ticks.map((t) => (
              <span key={t}>{t >= 1000 ? `${(t / 1000).toFixed(t % 1000 === 0 ? 0 : 1)}K` : t}</span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative">
              {/* dashed gridlines */}
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                {ticks.map((_, i) => (
                  <div
                    key={i}
                    className="w-full"
                    style={{ height: 1, borderTop: "1px dashed", borderColor: "rgba(156,163,175,0.3)" }}
                  />
                ))}
              </div>

              {/* week columns */}
              <div
                className="relative flex h-52 items-end justify-between gap-2 sm:gap-3"
                role="img"
                aria-label={`${metricLabel} across ${groups.length} week${groups.length === 1 ? "" : "s"}, from ${first} to ${last} (${delta >= 0 ? "up" : "down"} ${Math.abs(delta)} percent).`}
              >
                {groups.map((group, gi) => (
                  <div key={group.key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                    <div className="flex h-full items-end justify-center gap-[3px]">
                      {group.points.map((d, i) => {
                        const value = mv(d);
                        const pct = (value / ceil) * 100;
                        const type = (d.serviceType ?? "SUNDAY") as ServiceTypeKey;
                        const color = SERIES_COLOR[type] ?? SERIES[0].color;
                        return (
                          <div
                            key={`${group.key}-${i}`}
                            className="group/bar relative flex h-full flex-1 flex-col justify-end"
                            style={{ maxWidth }}
                          >
                            <span
                              className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-bold leading-tight text-white opacity-0 shadow-lg transition-opacity group-hover/bar:opacity-100"
                              style={{ background: color }}
                            >
                              {value.toLocaleString()} {metricLabel.toLowerCase()}
                              <span className="block font-semibold opacity-80">
                                {fullDate(d.date ?? group.key)}
                              </span>
                            </span>

                            <div
                              className="w-full rounded-t-[3px] transition-opacity duration-150 hover:opacity-80"
                              style={{
                                height: `${pct}%`,
                                minHeight: pct > 0 ? 3 : 0,
                                background: color,
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* week label, thinned as the range widens */}
                    <div className="mt-2 flex h-4 items-start justify-center">
                      {gi % stride === 0 && (
                        <span className="text-[9px] tabular-nums text-gray-400 dark:text-white/35">
                          {group.label}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ul className="sr-only">
        {points.map((d, i) => (
          <li key={`${d.label}-${i}`}>{`${d.label}: ${mv(d)} ${metricLabel.toLowerCase()}`}</li>
        ))}
      </ul>
    </DashboardCard>
  );
}
