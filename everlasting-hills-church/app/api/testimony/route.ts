import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone_number, content, share_physically } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Testimony content is required." },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "Testimony is too long." },
        { status: 400 }
      );
    }

    await db.formSubmission.create({
      data: {
        tenantId: TENANT_ID,
        type: "testimony",
        data: {
          name: name ? String(name).trim() : null,
          phone_number: phone_number ? String(phone_number).trim() : null,
          content: content.trim(),
          share_physically: share_physically ?? null,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/testimony]", error);
    return NextResponse.json(
      { error: "Failed to save. Please try again." },
      { status: 500 }
    );
  }
}
