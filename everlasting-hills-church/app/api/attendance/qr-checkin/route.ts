import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { checkInByServiceId } from "@/services/attendance.service";
import { signServiceId } from "@/lib/qr/sign";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const serviceId = searchParams.get("serviceId");
  const sig = searchParams.get("sig");

  if (!serviceId || !sig) {
    return NextResponse.redirect(`${APP_URL}/me?qr=invalid`);
  }

  const expected = signServiceId(serviceId);
  if (sig !== expected) {
    return NextResponse.redirect(`${APP_URL}/me?qr=invalid`);
  }

  const user = await getCurrentUser();
  if (!user) {
    const callbackUrl = encodeURIComponent(`/api/attendance/qr-checkin?serviceId=${serviceId}&sig=${sig}`);
    return NextResponse.redirect(`${APP_URL}/login?callbackUrl=${callbackUrl}`);
  }

  try {
    const result = await checkInByServiceId(user.id, serviceId);
    if (result.alreadyCheckedIn) {
      return NextResponse.redirect(`${APP_URL}/me?qr=already`);
    }
    return NextResponse.redirect(`${APP_URL}/me?qr=success&service=${encodeURIComponent(result.service.name)}`);
  } catch (err) {
    console.error("[GET /api/attendance/qr-checkin]", err);
    return NextResponse.redirect(`${APP_URL}/me?qr=error`);
  }
}
