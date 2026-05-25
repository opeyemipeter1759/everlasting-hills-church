/* import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { hasMinRole } from "@/components/dashboard/shell/role-utils";
import {
  getGrowthSummary,
  getMemberGrowthByMonth,
  getMemberStatusDistribution,
  getChurnRisk,
  getRetentionRate,
} from "@/services/growth-analytics.service";
import GrowthCharts from "@/components/dashboard/analytics/GrowthCharts";

export const metadata = { title: "Growth Analytics" };

export default async function GrowthAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!profile || !hasMinRole(profile.role, "ADMIN")) redirect("/dashboard");

  const [summary, growthByMonth, statusDist, churnRisk, retention] = await Promise.all([
    getGrowthSummary(),
    getMemberGrowthByMonth(12),
    getMemberStatusDistribution(),
    getChurnRisk(),
    getRetentionRate(),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Growth Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Member growth trends, retention rates, and churn risk
        </p>
      </div>
      <GrowthCharts
        summary={summary}
        growthByMonth={growthByMonth}
        statusDist={statusDist}
        churnRisk={churnRisk}
        retentionRate={retention.retentionRate}
      />
    </div>
  );
}
 */

import React from 'react'

export default function page() {
  return (
    <div>page</div>
  )
}
