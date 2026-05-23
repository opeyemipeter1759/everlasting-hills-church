import { NextRequest, NextResponse } from "next/server";
import { updateMemberStatus } from "@/services/member.service";
import { MemberStatus } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    if (!Object.values(MemberStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const member = await updateMemberStatus(params.id, status as MemberStatus);
    return NextResponse.json({ data: member });
  } catch (err) {
    console.error("[PATCH /api/members/[id]/status]", err);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
