import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getSermonById, updateSermon, deleteSermon, setFeaturedSermon } from "@/services/sermon.service";
import { SermonStatus } from "@prisma/client";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sermon = await getSermonById(params.id);
  if (!sermon) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: sermon });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (body.setFeatured) {
    const sermon = await setFeaturedSermon(params.id);
    return NextResponse.json({ data: sermon });
  }

  const sermon = await updateSermon(params.id, {
    ...body,
    status: body.status as SermonStatus | undefined,
  });
  return NextResponse.json({ data: sermon });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteSermon(params.id);
  return NextResponse.json({ success: true });
}
