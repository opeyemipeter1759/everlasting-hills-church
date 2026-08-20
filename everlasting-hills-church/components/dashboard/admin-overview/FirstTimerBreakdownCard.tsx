"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { UserPlus } from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import { useFirstTimerStats } from "@/lib/api/visitors";

const COLORS = {
  onsite: "#87102C",
  online: "#C9973F",
  empty: "#e5e7eb",
};

const DARK_COLORS = {
  onsite: "#87102C",
  online: "#C9973F",
  empty: "rgba(255,255,255,0.08)",
};

export default function FirstTimerBreakdownCard(chrome: DashboardCardChrome) {
  const { data, isLoading, isError } = useFirstTimerStats();

  const onsite = data?.onsite ?? 0;
  const online = data?.online ?? 0;
  const total  = data?.total ?? onsite + online;

  const chartData =
    total > 0
      ? [
          { name: "Onsite",  value: onsite, color: COLORS.onsite  },
          { name: "Online",  value: online, color: COLORS.online  },
        ]
      : [{ name: "No data", value: 1, color: COLORS.empty }];

  const onsitePct = total > 0 ? Math.round((onsite / total) * 100) : 0;
  const onlinePct = total > 0 ? Math.round((online / total) * 100) : 0;

  return (
    <DashboardCard kicker="First Timers" title="Onsite vs Online" icon={UserPlus} {...chrome}>
      {isLoading ? (
        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="h-44 w-44 animate-pulse rounded-full bg-gray-100 dark:bg-white/5" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
        </div>
      ) : isError ? (
        <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-xs text-gray-400 dark:text-white/30">
          Could not load breakdown
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* Donut */}
          <div className="relative w-full" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black tabular-nums text-gray-900 dark:text-white leading-none">
                {total > 0 ? total.toLocaleString() : "—"}
              </span>
              <span className="mt-1 text-[10px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wide">
                Visitors
              </span>
            </div>
          </div>

          {/* Legend */}
          {total > 0 ? (
            <div className="mt-1 flex w-full items-center justify-center gap-6">
              <LegendDot color={COLORS.onsite} label="Onsite" pct={onsitePct} count={onsite} />
              <LegendDot color={COLORS.online} label="Online" pct={onlinePct} count={online} />
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-400 dark:text-white/30">
              No first-timer submissions yet
            </p>
          )}
        </div>
      )}
    </DashboardCard>
  );
}

function LegendDot({
  color,
  label,
  pct,
  count,
}: {
  color: string;
  label: string;
  pct: number;
  count: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-[11px] font-semibold text-gray-600 dark:text-white/60">{label}</span>
      </div>
      <span className="text-sm font-black tabular-nums text-gray-900 dark:text-white">{pct}%</span>
      <span className="text-[10px] text-gray-400 dark:text-white/30">{count.toLocaleString()}</span>
    </div>
  );
}
