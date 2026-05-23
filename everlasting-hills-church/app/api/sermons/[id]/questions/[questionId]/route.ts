import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getMemberWithProfile } from "@/services/member.service";
import { isAdmin } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getMemberWithProfile(user.id);
  if (!profile || !isAdmin(profile.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.discussionQuestion.delete({
    where: { id: params.questionId, sermonId: params.id },
  });

  return NextResponse.json({ success: true });
}
