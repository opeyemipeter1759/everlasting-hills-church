"use client";

import type { GrowthSummary, ChurnRisk } from "@/services/growth-analytics.service";
import StatCard from "./StatCard";
import BarChart from "./BarChart";
import { Users, TrendingUp, UserMinus, Activity } from "lucide-react";

type MonthBar = { label: string; joined: number; cumulative: number };
type StatusDist = { status: string; count: number };

type Props = {
  summary: GrowthSummary;
  growthByMonth: MonthBar[];
  statusDist: StatusDist[];
  churnRisk: ChurnRisk;
  retentionRate: number;
};

export default function GrowthCharts({
  summary,
  growthByMonth,
  statusDist,
  churnRisk,
  retentionRate,
}: Props) {
  const maxCumulative = Math.max(...growthByMonth.map((m) => m.cumulative), 1);

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-500",
    INACTIVE: "bg-gray-400",
    TRANSFERRED: "bg-blue-400",
    DECEASED: "bg-red-400",
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Members"
          value={summary.total.toLocaleString()}
          icon={Users}
          iconColor="text-blue-400"
        />
        <StatCard
          label="Active Members"
          value={summary.active.toLocaleString()}
          sub={`${Math.round((summary.active / Math.max(summary.total, 1)) * 100)}% of total`}
          icon={Activity}
          iconColor="text-green-400"
        />
        <StatCard
          label="New This Month"
          value={summary.thisMonth.toLocaleString()}
          trend={summary.momChange}
          icon={TrendingUp}
          iconColor="text-purple-400"
        />
        <StatCard
          label="Retention Rate"
          value={`${retentionRate}%`}
          sub="attended 2+ services in 30 days"
          icon={UserMinus}
          iconColor="text-amber-400"
        />
      </div>

      {/* Cumulative growth chart */}
      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Member Growth (last 12 months)
        </p>
        {growthByMonth.length === 0 ? (
          <p className="text-sm text-gray-400">No data yet.</p>
        ) : (
          <div className="space-y-1">
            {/* Cumulative line */}
            <div className="flex items-end gap-1.5 h-32">
              {growthByMonth.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="w-full flex items-end" style={{ height: "80px" }}>
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm"
                      style={{
                        height: `${Math.round((m.cumulative / maxCumulative) * 80)}px`,
                      }}
                      title={`${m.label}: ${m.cumulative} total, +${m.joined} new`}
                    />
                  </div>
                  <span className="text-[9px] text-gray-400 truncate w-full text-center">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>New per month: {growthByMonth.map((m) => m.joined).join(", ")}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status distribution */}
        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Member Status Distribution
          </p>
          <div className="space-y-3">
            {statusDist.map((s) => {
              const pct = Math.round((s.count / Math.max(summary.total, 1)) * 100);
              return (
                <div key={s.status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{s.status}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {s.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${statusColors[s.status] ?? "bg-gray-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Churn risk */}
        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Churn Risk (60-day absence)
            </p>
            <span className="text-xs bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
              {churnRisk.churnRate}% at risk
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {churnRisk.atRiskCount} of {churnRisk.totalActive} active members not seen in 60 days
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {churnRisk.atRiskMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-500 text-xs font-bold flex-shrink-0">
                  {m.firstName.charAt(0)}
                </div>
                <span className="flex-1 text-xs text-gray-800 dark:text-gray-200 truncate">
                  {m.firstName} {m.lastName}
                </span>
                {m.email && (
                  <span className="text-[10px] text-gray-400 truncate max-w-[100px]">
                    {m.email}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
