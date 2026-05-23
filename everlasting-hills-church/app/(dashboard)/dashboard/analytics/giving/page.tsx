import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { hasMinRole } from "@/components/dashboard/shell/role-utils";
import {
  getGivingSummary,
  getGivingTrend,
  getGivingByCategory,
  getTopDonors,
} from "@/services/giving-analytics.service";
import GivingCharts from "@/components/dashboard/analytics/GivingCharts";

export const metadata = { title: "Giving Analytics" };

export default async function GivingAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!profile || !hasMinRole(profile.role, "PASTOR")) redirect("/dashboard");

  const [summary, trend, categories, topDonors] = await Promise.all([
    getGivingSummary(),
    getGivingTrend(6),
    getGivingByCategory(),
    getTopDonors(10),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Giving Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Giving totals, trends by month, category breakdown, and top donors
        </p>
      </div>
      <GivingCharts
        summary={summary}
        trend={trend}
        categories={categories}
        topDonors={topDonors}
      />
    </div>
  );
}
