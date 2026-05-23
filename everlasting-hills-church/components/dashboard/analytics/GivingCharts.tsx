"use client";

import type { GivingSummary } from "@/services/giving-analytics.service";
import StatCard from "./StatCard";
import BarChart from "./BarChart";
import { DollarSign, TrendingUp, Users, AlertCircle } from "lucide-react";

type TrendBar = { label: string; amountNaira: number; count: number };
type Category = { category: string; amountNaira: number; count: number };
type TopDonor = { name: string; email: string | null; amountNaira: number; count: number };

type Props = {
  summary: GivingSummary;
  trend: TrendBar[];
  categories: Category[];
  topDonors: TopDonor[];
};

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n.toLocaleString()}`;
}

export default function GivingCharts({ summary, trend, categories, topDonors }: Props) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Raised"
          value={fmt(summary.totalNaira)}
          sub={`${summary.totalCount} transactions`}
          icon={DollarSign}
          iconColor="text-green-400"
        />
        <StatCard
          label="This Month"
          value={fmt(summary.thisMonthNaira)}
          trend={summary.momChange}
          icon={TrendingUp}
          iconColor="text-blue-400"
        />
        <StatCard
          label="Unique Donors"
          value={summary.uniqueDonors.toLocaleString()}
          icon={Users}
          iconColor="text-purple-400"
        />
        <StatCard
          label="Anonymous"
          value={`${summary.anonymousPct}%`}
          sub={`${summary.anonymous} transactions`}
          icon={AlertCircle}
          iconColor="text-amber-400"
        />
      </div>

      {/* Trend */}
      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Giving Trend (last 6 months)
        </p>
        {trend.length === 0 ? (
          <p className="text-sm text-gray-400">No giving records yet.</p>
        ) : (
          <>
            <div className="flex items-end gap-1.5 h-32">
              {(() => {
                const max = Math.max(...trend.map((t) => t.amountNaira), 1);
                return trend.map((t, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-[10px] text-gray-500 font-medium">
                      {fmt(t.amountNaira)}
                    </span>
                    <div className="w-full flex items-end" style={{ height: "80px" }}>
                      <div
                        className="w-full bg-green-500 rounded-t-sm hover:bg-green-400 transition-all"
                        style={{ height: `${Math.round((t.amountNaira / max) * 80)}px` }}
                        title={`${t.label}: ${fmt(t.amountNaira)} (${t.count} transactions)`}
                      />
                    </div>
                    <span className="text-[9px] text-gray-400 truncate w-full text-center">
                      {t.label}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Categories */}
        <BarChart
          title="Giving by Category"
          data={categories.map((c) => ({ label: c.category, value: c.amountNaira }))}
          color="bg-green-500"
          formatValue={fmt}
        />

        {/* Top donors */}
        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Top Donors (all-time)
          </p>
          {topDonors.length === 0 ? (
            <p className="text-sm text-gray-400">No donor data yet.</p>
          ) : (
            <div className="space-y-2">
              {topDonors.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5 text-right">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">
                    {d.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{d.name}</p>
                    <p className="text-[10px] text-gray-400">{d.count} transactions</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {fmt(d.amountNaira)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
