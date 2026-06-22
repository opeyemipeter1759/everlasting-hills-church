"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ChartCard } from "@/components/ui/display/ChartCard";
import { ChartSkeleton } from "@/components/ui/display/SkeletonBlock";
import type { AnalyticsFilter } from "@/lib/api/analytics";
import { useAnalyticsRateTrend } from "@/lib/api/analytics";

interface Props { filter: AnalyticsFilter }

export function RateLineChart({ filter }: Props) {
  const { data, isLoading } = useAnalyticsRateTrend(filter);
  return (
    <ChartCard title="Attendance Rate Over Time" onExportCsv={() => {}} minHeight="min-h-[240px]">
      {isLoading ? <ChartSkeleton /> : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#87102C" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#87102C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <ReferenceLine y={75} stroke="#9ca3af" strokeDasharray="4 2" label={{ value: "Target 75%", position: "insideTopRight", fontSize: 9, fill: "#9ca3af" }} />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Tooltip formatter={((v: number) => `${v}%`) as any} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Area type="monotone" dataKey="rate" name="Rate %" stroke="#87102C" strokeWidth={2} fill="url(#rateGrad)" dot={{ r: 3, fill: "#87102C" }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
