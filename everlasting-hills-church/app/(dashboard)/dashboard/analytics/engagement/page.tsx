import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { hasMinRole } from "@/components/dashboard/shell/role-utils";
import {
  getEngagementLeaderboard,
  getAtRiskMembers,
  getEngagementDistribution,
  getEngagementSummary,
} from "@/services/engagement.service";
import EngagementCharts from "@/components/dashboard/analytics/EngagementCharts";

export const metadata = { title: "Engagement Analytics" };

export default async function EngagementAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!profile || !hasMinRole(profile.role, "PASTOR")) redirect("/dashboard");

  const [summary, leaderboard, atRisk, distribution] = await Promise.all([
    getEngagementSummary(),
    getEngagementLeaderboard(25),
    getAtRiskMembers(),
    getEngagementDistribution(),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Engagement Scoring</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Member engagement scores (0–100) based on attendance, sermons, giving, and community
        </p>
      </div>
      <EngagementCharts
        summary={summary}
        leaderboard={leaderboard}
        atRisk={atRisk}
        distribution={distribution}
      />
    </div>
  );
}
