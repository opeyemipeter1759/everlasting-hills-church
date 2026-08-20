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

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: "value",       label: "Total",        color: "#87102C" },
  { key: "men",         label: "Men",          color: "#2563eb" },
  { key: "women",       label: "Women",        color: "#db2777" },
  { key: "children",    label: "Children",     color: "#d97706" },
  { key: "firstTimers", label: "First-timers", color: "#059669" },
];

const MAX_BARS = 10;

/**
 * Formats the x-axis label for a bar.
 * Prefers the pre-formatted d.label (e.g. "Sun 05/04"). Only falls back to
 * parsing d.date if the label is a plain date string with no day prefix.
 * Safely handles full ISO timestamps from the backend by slicing to 10 chars first.
 */
function barLabel(d: AttendancePoint): { day: string; date: string } {
  // If the label already has a day prefix (e.g. "Sun 05/04"), use it directly.
  const parts = d.label.split(" ");
  if (parts.length >= 2 && parts[0].length === 3) {
    return { day: parts[0], date: parts.slice(1).join(" ") };
  }

  // Try to parse from the ISO date field — slice to "yyyy-MM-dd" first to avoid
  // "Invalid Date" when the backend returns a full timestamp like "2026-04-05T09:00:00Z".
  if (d.date) {
    const dateOnly = d.date.slice(0, 10); // "2026-04-05"
    const dt = new Date(dateOnly + "T00:00:00");
    if (!isNaN(dt.getTime())) {
      const day = dt.toLocaleDateString("en-GB", { weekday: "short" });
      const dd = String(dt.getDate()).padStart(2, "0");
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const yy = String(dt.getFullYear()).slice(-2);
      return { day, date: `${dd}/${mm}/${yy}` };
    }
  }

  // Last resort: show the raw label on one line
  return { day: d.label, date: "" };
}

export default function AttendanceTrendCard({
  data,
  ...chrome
}: { data: AttendancePoint[] } & DashboardCardChrome) {
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [metric, setMetric] = useState<MetricKey>("value");

  const hasTypes     = useMemo(() => data.some((d) => d.serviceType), [data]);
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
  const last  = filtered.length ? mv(filtered[filtered.length - 1]) : 0;
  const delta = first ? Math.round(((last - first) / first) * 100) : 0;
  const metricLabel  = METRICS.find((m) => m.key === metric)?.label ?? "Total";
  const activeColor  = METRICS.find((m) => m.key === metric)?.color ?? "#87102C";

  const action = (
    <div className="flex items-center gap-2 flex-wrap">
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
      {filtered.length > 1 && (
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
      {/* Category metric tabs */}
      {hasBreakdown && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors border ${
                metric === m.key
                  ? "border-transparent text-white shadow-sm"
                  : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white"
              }`}
              style={metric === m.key ? { background: m.color } : undefined}
              aria-pressed={metric === m.key}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-white/[0.09] text-sm text-gray-400 dark:text-white/40">
          No {filter === "WEDNESDAY" ? "Wednesday" : filter === "SUNDAY" ? "Sunday" : ""} services recorded yet.
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
                    style={{
                      height: 1,
                      borderTop: "1px dashed",
                      borderColor: "rgba(156,163,175,0.3)",
                    }}
                  />
                ))}
              </div>

              {/* bars */}
              <div
                className="relative flex h-52 items-end justify-between gap-1.5 sm:gap-2"
                role="img"
                aria-label={`${metricLabel} over the last ${filtered.length} ${
                  filter === "ALL" ? "" : filter.toLowerCase() + " "
                }services, from ${first} to ${last} (${delta >= 0 ? "up" : "down"} ${Math.abs(delta)} percent).`}
              >
                {filtered.map((d, i) => {
                  const pct = (mv(d) / ceil) * 100;
                  const isLast = i === filtered.length - 1;
                  const lbl = barLabel(d);
                  return (
                    <div
                      key={`${d.label}-${i}`}
                      className="group relative flex h-full flex-1 flex-col items-center justify-end"
                    >
                      {/* tooltip */}
                      <span
                        className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-bold tabular-nums text-white opacity-0 transition-opacity group-hover:opacity-100 shadow"
                        style={{ background: activeColor }}
                      >
                        {mv(d).toLocaleString()}
                      </span>

                      {/* bar */}
                      <div
                        className="w-full rounded-t-[4px] transition-all duration-200 cursor-default"
                        style={{
                          height: `${pct}%`,
                          minHeight: pct > 0 ? 4 : 0,
                          background: isLast
                            ? activeColor
                            : metric === "value"
                            ? "rgba(156,163,175,0.45)"
                            : "rgba(156,163,175,0.35)",
                          // hover effect applied via JS because inline style has priority
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background = activeColor;
                          (e.currentTarget as HTMLDivElement).style.opacity = "0.85";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.opacity = "1";
                          (e.currentTarget as HTMLDivElement).style.background = isLast
                            ? activeColor
                            : metric === "value"
                            ? "rgba(156,163,175,0.45)"
                            : "rgba(156,163,175,0.35)";
                        }}
                      />

                      {/* x-axis label — two lines */}
                      <div className="mt-2 flex flex-col items-center leading-none">
                        <span className="text-[9px] font-bold text-gray-500 dark:text-white/50">{lbl.day}</span>
                        {lbl.date && (
                          <span className="text-[8px] text-gray-400 dark:text-white/30 tabular-nums mt-0.5">{lbl.date}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
