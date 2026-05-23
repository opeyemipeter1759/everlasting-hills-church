import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import {
  upsertReaction, toggleBookmark, upsertNote,
  saveProgress, getMemberContext,
} from "@/services/sermon.service";

async function getMember(userId: string) {
  const profile = await db.profile.findUnique({ where: { userId } });
  if (!profile) return null;
  return db.member.findUnique({ where: { profileId: profile.id } });
}

async function getSermonIdBySlug(slug: string) {
  const s = await db.sermon.findUnique({ where: { slug }, select: { id: true } });
  return s?.id ?? null;
}

// GET — fetch member context (reaction, bookmark, note, progress)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ data: null });

  const sermonId = await getSermonIdBySlug(params.id);
  if (!sermonId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ctx = await getMemberContext(user.id, sermonId);
  return NextResponse.json({ data: ctx });
}

// POST — react, bookmark, note, or progress
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const sermonId = await getSermonIdBySlug(params.id);
  if (!sermonId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await getMember(user.id);
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const { action } = body;

  if (action === "react") {
    const result = await upsertReaction(member.id, sermonId, body.type);
    return NextResponse.json({ data: result });
  }
  if (action === "bookmark") {
    const bookmarked = await toggleBookmark(member.id, sermonId);
    return NextResponse.json({ data: { bookmarked } });
  }
  if (action === "note") {
    const note = await upsertNote(member.id, sermonId, body.content ?? "");
    return NextResponse.json({ data: note });
  }
  if (action === "progress") {
    const prog = await saveProgress(member.id, sermonId, body.positionSec ?? 0, body.completed ?? false);
    return NextResponse.json({ data: prog });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
