import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { hasMinRole } from "@/components/dashboard/shell/role-utils";
import { getPastoralAlerts, getAlertCounts } from "@/services/pastoral-alerts.service";
import AlertList from "@/components/dashboard/analytics/AlertList";

export const metadata = { title: "Pastoral Alerts" };

export default async function PastoralAlertsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!profile || !hasMinRole(profile.role, "PASTOR")) redirect("/dashboard");

  const [alerts, counts] = await Promise.all([
    getPastoralAlerts(false),
    getAlertCounts(),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Pastoral Alerts</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Absence alerts, birthdays, inactive members, and at-risk flags
        </p>
      </div>
      <AlertList alerts={alerts} counts={counts} />
    </div>
  );
}
