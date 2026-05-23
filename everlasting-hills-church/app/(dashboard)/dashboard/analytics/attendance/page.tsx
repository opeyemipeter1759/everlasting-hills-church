import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { hasMinRole } from "@/components/dashboard/shell/role-utils";
import {
  getAttendanceSummary,
  getAttendanceTrend,
  getTopAttendees,
  getAttendanceByDayOfWeek,
} from "@/services/attendance-analytics.service";
import AttendanceCharts from "@/components/dashboard/analytics/AttendanceCharts";

export const metadata = { title: "Attendance Analytics" };

export default async function AttendanceAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!profile || !hasMinRole(profile.role, "ADMIN")) redirect("/dashboard");

  const [summary, trend, topAttendees, byDayOfWeek] = await Promise.all([
    getAttendanceSummary(),
    getAttendanceTrend(16),
    getTopAttendees(10),
    getAttendanceByDayOfWeek(),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Attendance Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Service attendance trends, top attendees, and weekly patterns
        </p>
      </div>
      <AttendanceCharts
        summary={summary}
        trend={trend}
        topAttendees={topAttendees}
        byDayOfWeek={byDayOfWeek}
      />
    </div>
  );
}
