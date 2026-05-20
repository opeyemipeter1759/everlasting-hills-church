import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { checkIn } from "@/services/attendance.service";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await checkIn(user.id);
    if (result.alreadyCheckedIn) {
      return NextResponse.json(
        { message: "Already checked in today", service: result.service.name },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { message: "Checked in successfully", service: result.service.name },
      { status: 201 }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Check-in failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
