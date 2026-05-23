import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { hasMinRole } from "@/components/dashboard/shell/role-utils";
import {
  getDepartmentStats,
  getUnitMemberAttendance,
} from "@/services/department-analytics.service";
import DepartmentStats from "@/components/dashboard/analytics/DepartmentStats";

export const metadata = { title: "Department Performance" };

export default async function DepartmentAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!profile || !hasMinRole(profile.role, "UNIT_LEAD")) redirect("/dashboard");

  // Unit leads see only their unit; admins+ see all
  let unitId: string | undefined;
  if (!hasMinRole(profile.role, "ADMIN")) {
    const unitMembership = await db.unitMember.findFirst({
      where: { tenantId: process.env.DEFAULT_TENANT_ID!, isLead: true, member: { profileId: profile.id } },
      select: { unitId: true },
    });
    if (!unitMembership) redirect("/dashboard");
    unitId = unitMembership.unitId;
  }

  const departments = await getDepartmentStats(unitId);

  // Pre-load the first unit's member detail
  const firstUnit = departments[0];
  const selectedUnitMembers = firstUnit
    ? await getUnitMemberAttendance(firstUnit.id, 3)
    : [];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Department Performance</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Attendance rates and member participation per unit/department
        </p>
      </div>
      <DepartmentStats
        departments={departments}
        selectedUnitMembers={selectedUnitMembers}
        selectedUnitName={firstUnit?.name}
      />
    </div>
  );
}
