import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { request, name, email, phone, is_anonymous } = body;

    if (!request || typeof request !== "string" || !request.trim()) {
      return NextResponse.json(
        { error: "Prayer request text is required." },
        { status: 400 }
      );
    }

    if (request.length > 3000) {
      return NextResponse.json(
        { error: "Prayer request is too long." },
        { status: 400 }
      );
    }

    await db.prayerRequest.create({
      data: {
        tenantId: TENANT_ID,
        request: request.trim(),
        name: name ? String(name).trim() : null,
        email: email ? String(email).trim() : null,
        phone: phone ? String(phone).trim() : null,
        isAnonymous: is_anonymous === true || is_anonymous === "true",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/prayer-request]", error);
    return NextResponse.json(
      { error: "Failed to save. Please try again." },
      { status: 500 }
    );
  }
}
