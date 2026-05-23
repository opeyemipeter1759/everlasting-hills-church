import { NextRequest, NextResponse } from "next/server";
import { deletePastorNote } from "@/services/member.service";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; noteId: string } }) {
  try {
    await deletePastorNote(params.noteId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/members/[id]/notes/[noteId]]", err);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
