import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendContactEmail } from "@/lib/email";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !message.trim()
    ) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (name.length > 100 || email.length > 200 || message.length > 2000) {
      return NextResponse.json({ error: "Input too long." }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    const trimmed = {
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    };

    await Promise.all([
      db.contactMessage.create({
        data: { tenantId: TENANT_ID, ...trimmed },
      }),
      sendContactEmail(trimmed),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/contact] Error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
