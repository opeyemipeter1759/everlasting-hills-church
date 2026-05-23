import { NextRequest, NextResponse } from "next/server";
import { toggleFollowUpTask, deleteFollowUpTask } from "@/services/member.service";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  try {
    const { done } = await req.json();
    if (typeof done !== "boolean") {
      return NextResponse.json({ error: "done must be a boolean" }, { status: 400 });
    }
    const task = await toggleFollowUpTask(params.taskId, done);
    return NextResponse.json({ data: task });
  } catch (err) {
    console.error("[PATCH /api/members/[id]/tasks/[taskId]]", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  try {
    await deleteFollowUpTask(params.taskId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/members/[id]/tasks/[taskId]]", err);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
