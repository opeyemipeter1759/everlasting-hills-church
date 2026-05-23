import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { hasMinRole } from "@/components/dashboard/shell/role-utils";
import {
  generateBirthdayAlerts,
  generateAbsenceAlerts,
  generateInactiveAlerts,
} from "@/services/pastoral-alerts.service";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!profile || !hasMinRole(profile.role, "PASTOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Promise.all([
    generateBirthdayAlerts(),
    generateAbsenceAlerts(3),
    generateInactiveAlerts(),
  ]);

  return NextResponse.json({ message: "Alerts generated successfully." });
}
