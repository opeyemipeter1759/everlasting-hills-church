"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartCard } from "@/components/ui/display/ChartCard";
import { ChartSkeleton } from "@/components/ui/display/SkeletonBlock";
import { useAnalyticsTrend, type AnalyticsFilter } from "@/lib/api/analytics";

const COLORS = { present: "#10b981", absent: "#ef4444" };

interface Props { filter: AnalyticsFilter }

export function AttendanceTrendChart({ filter }: Props) {
  const { data, isLoading } = useAnalyticsTrend(filter);
  return (
    <ChartCard
      title="Attendance Trend"
      onExportCsv={() => {}}
      onExportPng={() => {}}
      minHeight="min-h-[240px]"
    >
      {isLoading || !data ? <ChartSkeleton /> : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Line type="monotone" dataKey="present" name="Present" stroke={COLORS.present} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="absent"  name="Absent"  stroke={COLORS.absent}  strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
