import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { incrementPlayCount } from "@/services/sermon.service";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const sermon = await db.sermon.findUnique({ where: { slug: params.id }, select: { id: true } });
  if (!sermon) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await incrementPlayCount(sermon.id);
  return NextResponse.json({ success: true });
}
