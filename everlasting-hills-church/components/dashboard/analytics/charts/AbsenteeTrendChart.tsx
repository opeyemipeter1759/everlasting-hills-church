"use client";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartCard } from "@/components/ui/display/ChartCard";
import { ChartSkeleton } from "@/components/ui/display/SkeletonBlock";
import type { AnalyticsFilter } from "@/lib/api/analytics";
import { useAnalyticsAbsentee } from "@/lib/api/analytics";

interface Props { filter: AnalyticsFilter }

export function AbsenteeTrendChart({ filter }: Props) {
  const { data, isLoading } = useAnalyticsAbsentee(filter);
  return (
    <ChartCard title="Absentee Trend" onExportCsv={() => {}} minHeight="min-h-[240px]">
      {isLoading ? <ChartSkeleton /> : (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Bar  dataKey="absent" name="Absent"       fill="#ef4444" fillOpacity={0.7} radius={[4,4,0,0]} />
            <Line dataKey="rate"   name="Absence Rate" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
