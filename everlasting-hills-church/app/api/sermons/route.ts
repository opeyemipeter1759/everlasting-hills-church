import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAllSermons, createSermon, getPublishedSermons } from "@/services/sermon.service";
import { SermonStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const admin = searchParams.get("admin") === "1";

  if (admin) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sermons = await getAllSermons();
    return NextResponse.json({ data: sermons });
  }

  const search = searchParams.get("search") ?? undefined;
  const series = searchParams.get("series") ?? undefined;
  const sermons = await getPublishedSermons({ search, series });
  return NextResponse.json({ data: sermons });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (!body.title || !body.speaker || !body.date) {
    return NextResponse.json({ error: "title, speaker, and date are required" }, { status: 400 });
  }

  const sermon = await createSermon({
    ...body,
    status: body.status as SermonStatus | undefined,
  });
  return NextResponse.json({ data: sermon }, { status: 201 });
}
