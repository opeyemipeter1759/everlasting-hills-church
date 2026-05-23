"use client";

import type { AttendanceTrend, AttendanceSummary } from "@/services/attendance-analytics.service";
import StatCard from "./StatCard";
import BarChart from "./BarChart";
import { Users, Calendar, TrendingUp, CheckCircle } from "lucide-react";

type TopAttendee = { memberId: string; name: string; photoUrl: string | null; count: number };
type DowBar = { label: string; avg: number; total: number };

type Props = {
  summary: AttendanceSummary;
  trend: AttendanceTrend;
  topAttendees: TopAttendee[];
  byDayOfWeek: DowBar[];
};

export default function AttendanceCharts({ summary, trend, topAttendees, byDayOfWeek }: Props) {
  const maxTrend = Math.max(...trend.map((t) => t.count), 1);

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Services"
          value={summary.totalServices.toLocaleString()}
          icon={Calendar}
          iconColor="text-blue-400"
        />
        <StatCard
          label="Avg Attendance"
          value={summary.avgAttendance.toLocaleString()}
          sub={`${summary.attendanceRate}% of members`}
          icon={Users}
          iconColor="text-purple-400"
        />
        <StatCard
          label="This Month"
          value={summary.thisMonthCheckins.toLocaleString()}
          trend={summary.momChange}
          icon={TrendingUp}
          iconColor="text-green-400"
        />
        <StatCard
          label="Total Check-ins"
          value={summary.totalCheckins.toLocaleString()}
          icon={CheckCircle}
          iconColor="text-amber-400"
        />
      </div>

      {/* Attendance trend line chart (CSS-based sparkline) */}
      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Attendance Trend (last {trend.length} services)
        </p>
        {trend.length === 0 ? (
          <p className="text-sm text-gray-400">No service data yet.</p>
        ) : (
          <div className="flex items-end gap-1.5 h-32">
            {trend.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                  {t.count}
                </span>
                <div className="w-full flex items-end" style={{ height: "80px" }}>
                  <div
                    className="w-full bg-blue-500 rounded-t-sm transition-all hover:bg-blue-400"
                    style={{ height: `${Math.round((t.count / maxTrend) * 80)}px` }}
                    title={`${t.label}: ${t.count}`}
                  />
                </div>
                <span className="text-[9px] text-gray-400 truncate w-full text-center">
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By day of week */}
        <BarChart
          title="Average Attendance by Day of Week"
          data={byDayOfWeek.map((d) => ({ label: d.label, value: d.avg }))}
          color="bg-purple-500"
        />

        {/* Top attendees */}
        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Top Attendees
          </p>
          {topAttendees.length === 0 ? (
            <p className="text-sm text-gray-400">No attendance records yet.</p>
          ) : (
            <div className="space-y-2">
              {topAttendees.map((a, i) => (
                <div key={a.memberId} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5 text-right">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                    {a.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.photoUrl} alt={a.name} className="w-full h-full object-cover" />
                    ) : (
                      a.name.charAt(0)
                    )}
                  </div>
                  <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">
                    {a.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {a.count}
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
