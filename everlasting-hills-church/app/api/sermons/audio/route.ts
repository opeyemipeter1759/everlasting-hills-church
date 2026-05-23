import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2/client";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const maxBytes = 100 * 1024 * 1024; // 100 MB
  if (file.size > maxBytes) return NextResponse.json({ error: "File must be under 100 MB" }, { status: 400 });

  const allowed = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/aac"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported audio format" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "mp3";
  const key = `sermons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await file.arrayBuffer();

  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    return NextResponse.json({ error: "R2 storage is not configured. Add R2_* env vars to .env.local." }, { status: 503 });
  }

  try {
    const r2 = getR2Client();
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: Buffer.from(bytes),
      ContentType: file.type,
    }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Upload to R2 failed: ${msg}` }, { status: 502 });
  }

  const audioUrl = `${R2_PUBLIC_URL}/${key}`;
  return NextResponse.json({ data: { audioUrl, audioKey: key } });
}
