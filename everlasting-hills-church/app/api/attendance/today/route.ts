import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getTodayAttendanceWithMembers, getAllServicesWithCounts } from "@/services/attendance.service";
import { db } from "@/lib/db/prisma";
import { isAdmin } from "@/lib/auth/rbac";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [today, allServices] = await Promise.all([
    getTodayAttendanceWithMembers(),
    getAllServicesWithCounts(),
  ]);
  return NextResponse.json({ today, allServices });
}
