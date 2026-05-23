import { NextRequest, NextResponse } from "next/server";
import { addFollowUpTask } from "@/services/member.service";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { title, dueDate } = await req.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const task = await addFollowUpTask(params.id, title.trim(), dueDate ?? undefined);
    return NextResponse.json({
      data: {
        id: task.id,
        title: task.title,
        done: task.done,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        createdAt: task.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[POST /api/members/[id]/tasks]", err);
    return NextResponse.json({ error: "Failed to add task" }, { status: 500 });
  }
}
