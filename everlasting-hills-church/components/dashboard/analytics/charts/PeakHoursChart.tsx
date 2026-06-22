"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { ChartCard } from "@/components/ui/display/ChartCard";
import { ChartSkeleton } from "@/components/ui/display/SkeletonBlock";
import type { AnalyticsFilter } from "@/lib/api/analytics";
import { useAnalyticsPeakHours } from "@/lib/api/analytics";

interface Props { filter: AnalyticsFilter }

export function PeakHoursChart({ filter }: Props) {
  const { data, isLoading } = useAnalyticsPeakHours(filter);
  const max = Math.max(...(data ?? []).map((d) => d.count), 1);

  return (
    <ChartCard title="Peak Check-in Hours" onExportCsv={() => {}} minHeight="min-h-[240px]">
      {isLoading ? <ChartSkeleton /> : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Bar dataKey="count" name="Check-ins" radius={[4, 4, 0, 0]}>
              {(data ?? []).map((entry, i) => (
                <Cell key={i} fill="#87102C" fillOpacity={0.3 + (entry.count / max) * 0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
