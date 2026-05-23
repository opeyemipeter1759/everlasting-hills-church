import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { hasMinRole } from "@/components/dashboard/shell/role-utils";
import {
  getFirstTimerPipeline,
  getFirstTimerSources,
  getFirstTimersByMonth,
} from "@/services/department-analytics.service";
import FirstTimerFunnel from "@/components/dashboard/analytics/FirstTimerFunnel";

export const metadata = { title: "First-Timer Analytics" };

export default async function FirstTimerAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!profile || !hasMinRole(profile.role, "ADMIN")) redirect("/dashboard");

  const [pipeline, byMonth, sources] = await Promise.all([
    getFirstTimerPipeline(),
    getFirstTimersByMonth(6),
    getFirstTimerSources(),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">First-Timer Pipeline</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Visitor conversion funnel, interest rates, and source breakdown
        </p>
      </div>
      <FirstTimerFunnel pipeline={pipeline} byMonth={byMonth} sources={sources} />
    </div>
  );
}
