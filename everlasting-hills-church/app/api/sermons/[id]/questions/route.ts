import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getMemberWithProfile } from "@/services/member.service";
import { isAdmin } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { z } from "zod";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

const schema = z.object({ question: z.string().min(1).max(500) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getMemberWithProfile(user.id);
  if (!profile || !isAdmin(profile.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const maxOrder = await db.discussionQuestion.findFirst({
    where: { sermonId: params.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const q = await db.discussionQuestion.create({
    data: {
      tenantId: TENANT_ID,
      sermonId: params.id,
      question: result.data.question,
      order: (maxOrder?.order ?? 0) + 1,
    },
  });

  return NextResponse.json({ data: { id: q.id, question: q.question, order: q.order } });
}
