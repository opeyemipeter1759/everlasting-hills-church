import { NextRequest, NextResponse } from "next/server";
import { addPastorNote } from "@/services/member.service";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { content } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    const note = await addPastorNote(params.id, content.trim());
    return NextResponse.json({
      data: {
        id: note.id,
        content: note.content,
        createdAt: note.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[POST /api/members/[id]/notes]", err);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}
