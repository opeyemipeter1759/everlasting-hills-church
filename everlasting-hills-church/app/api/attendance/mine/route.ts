import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getMemberAttendance } from "@/services/attendance.service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await getMemberAttendance(user.id);
  return NextResponse.json(records);
}
