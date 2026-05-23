import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { hasMinRole } from "@/components/dashboard/shell/role-utils";
import ReportsPanel from "@/components/dashboard/analytics/ReportsPanel";

export const metadata = { title: "Reports & Exports" };

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!profile || !hasMinRole(profile.role, "PASTOR")) redirect("/dashboard");

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reports & Exports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Generate and download reports for pastoral, board, and administrative use
        </p>
      </div>
      <ReportsPanel />
    </div>
  );
}
