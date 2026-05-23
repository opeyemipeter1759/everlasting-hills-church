import { NextRequest, NextResponse } from "next/server";
import { subscribeEmail } from "@/services/sermon.service";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { getMemberWithProfile } from "@/services/member.service";
import { db } from "@/lib/db/prisma";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  await subscribeEmail(result.data.email);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getMemberWithProfile(user.id);
  if (!profile || !isAdmin(profile.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db.emailSubscriber.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
