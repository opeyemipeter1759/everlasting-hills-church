"use client";

import type { FirstTimerPipeline } from "@/services/department-analytics.service";
import StatCard from "./StatCard";
import BarChart from "./BarChart";
import { UserPlus, TrendingUp, Heart, MapPin } from "lucide-react";

type MonthBar = { label: string; count: number };
type Source = { label: string; value: number };

type Props = {
  pipeline: FirstTimerPipeline;
  byMonth: MonthBar[];
  sources: Source[];
};

export default function FirstTimerFunnel({ pipeline, byMonth, sources }: Props) {
  const funnelSteps = [
    { label: "Total First Timers", value: pipeline.total, pct: 100, color: "bg-blue-500" },
    {
      label: "Showed Interest in Membership",
      value: pipeline.interestedCount,
      pct: pipeline.interestRate,
      color: "bg-purple-500",
    },
    {
      label: "Became Members",
      value: pipeline.convertedCount,
      pct: pipeline.conversionRate,
      color: "bg-green-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total First Timers"
          value={pipeline.total.toLocaleString()}
          icon={UserPlus}
          iconColor="text-blue-400"
        />
        <StatCard
          label="Interest Rate"
          value={`${pipeline.interestRate}%`}
          sub={`${pipeline.interestedCount} expressed interest`}
          icon={Heart}
          iconColor="text-pink-400"
        />
        <StatCard
          label="Conversion Rate"
          value={`${pipeline.conversionRate}%`}
          sub="interested → member"
          icon={TrendingUp}
          iconColor="text-green-400"
        />
        <StatCard
          label="In-Person"
          value={pipeline.inPersonCount.toLocaleString()}
          sub={`vs ${pipeline.onlineCount} online`}
          icon={MapPin}
          iconColor="text-amber-400"
        />
      </div>

      {/* Funnel */}
      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-5">
          Conversion Funnel
        </p>
        <div className="space-y-3">
          {funnelSteps.map((step, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-700 dark:text-gray-300">{step.label}</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {step.value.toLocaleString()}
                  <span className="text-xs font-normal text-gray-400 ml-1">({step.pct}%)</span>
                </span>
              </div>
              <div className="h-6 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full ${step.color} rounded-lg transition-all flex items-center pl-3`}
                  style={{ width: `${Math.max(step.pct, 2)}%` }}
                >
                  <span className="text-[10px] text-white font-semibold whitespace-nowrap">
                    {step.value}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Attendance type split */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
            Attendance Type Split
          </p>
          <div className="flex gap-4 text-sm">
            {[
              { label: "In-Person", value: pipeline.inPersonCount, color: "bg-blue-500" },
              { label: "Online", value: pipeline.onlineCount, color: "bg-purple-500" },
              {
                label: "Not Specified",
                value: pipeline.total - pipeline.inPersonCount - pipeline.onlineCount,
                color: "bg-gray-400",
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-gray-600 dark:text-gray-400 text-xs">
                  {item.label}:{" "}
                  <strong className="text-gray-900 dark:text-white">{item.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By month */}
        <BarChart
          title="First Timers per Month"
          data={byMonth.map((m) => ({ label: m.label, value: m.count }))}
          color="bg-blue-500"
        />

        {/* Sources */}
        <BarChart
          title="How They Found Us"
          data={sources}
          color="bg-purple-500"
        />
      </div>
    </div>
  );
}
