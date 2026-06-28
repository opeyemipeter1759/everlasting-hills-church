"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartCard } from "@/components/ui/display/ChartCard";
import { ChartSkeleton } from "@/components/ui/display/SkeletonBlock";
import type { AnalyticsFilter } from "@/lib/api/analytics";
import { useAnalyticsMemberGrowth } from "@/lib/api/analytics";

interface Props { filter: AnalyticsFilter }

export function MemberGrowthChart({ filter }: Props) {
  const { data, isLoading } = useAnalyticsMemberGrowth(filter);
  return (
    <ChartCard title="Member Growth Trend" onExportCsv={() => {}} onExportPng={() => {}} minHeight="min-h-[240px]">
      {isLoading ? <ChartSkeleton /> : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data ?? []} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Area type="monotone" dataKey="totalMembers" name="Total Members" stroke="#6366f1" strokeWidth={2} fill="url(#totalGrad)" />
            <Area type="monotone" dataKey="newMembers"   name="New This Month" stroke="#f59e0b" strokeWidth={2} fill="url(#newGrad)" dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
