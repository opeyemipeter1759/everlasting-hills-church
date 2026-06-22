"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartCard } from "@/components/ui/display/ChartCard";
import { ChartSkeleton } from "@/components/ui/display/SkeletonBlock";
import type { AnalyticsFilter } from "@/lib/api/analytics";
import { useAnalyticsSvcCompare } from "@/lib/api/analytics";

const SVC_COLORS: Record<string, string> = { sunday: "#87102C", wednesday: "#3b82f6", special: "#10b981" };

interface Props { filter: AnalyticsFilter }

export function ServiceComparisonChart({ filter }: Props) {
  const { data, isLoading } = useAnalyticsSvcCompare(filter);

  // Pivot array of {serviceKey, present, absent} into a single bar-chart row per service
  const chartData = (data ?? []).map((d) => ({
    label: d.serviceKey.charAt(0).toUpperCase() + d.serviceKey.slice(1),
    present: d.present,
    absent: d.absent,
    fill: SVC_COLORS[d.serviceKey] ?? "#6366f1",
  }));

  return (
    <ChartCard title="Service Comparison" onExportCsv={() => {}} onExportPng={() => {}} minHeight="min-h-[240px]">
      {isLoading ? <ChartSkeleton /> : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)" }} />
            <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Bar dataKey="present" name="Present" fill="#87102C" radius={[4, 4, 0, 0]} />
            <Bar dataKey="absent"  name="Absent"  fill="#e5e7eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
