"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartCard } from "@/components/ui/display/ChartCard";
import { ChartSkeleton } from "@/components/ui/display/SkeletonBlock";
import type { AnalyticsFilter } from "@/lib/api/analytics";
import { useAnalyticsSplit } from "@/lib/api/analytics";

const COLORS = ["#10b981", "#ef4444"];

interface Props { filter: AnalyticsFilter }

export function PresentAbsentDonut({ filter }: Props) {
  const { data, isLoading } = useAnalyticsSplit(filter);
  const present = data?.present ?? 0;
  const absent  = data?.absent  ?? 0;
  const total   = data?.total   ?? 1;
  const rate    = data?.rate    ?? 0;
  const chartData = [{ name: "Present", value: present }, { name: "Absent", value: absent }];

  return (
    <ChartCard title="Present vs Absent" onExportPng={() => {}} minHeight="min-h-[240px]">
      {isLoading ? <ChartSkeleton /> : (
        <div className="flex flex-col items-center h-full">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip formatter={((v: number) => `${v} (${((v / total) * 100).toFixed(1)}%)`) as any} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{rate}%</p>
          <p className="text-[10px] text-gray-400">attendance rate</p>
        </div>
      )}
    </ChartCard>
  );
}
