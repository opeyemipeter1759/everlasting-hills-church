import { NextRequest, NextResponse } from "next/server";
import { Api } from "telegram";
import { getTelegramClient } from "@/lib/telegram-client";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const CHANNEL = process.env.TELEGRAM_CHANNEL_USERNAME?.trim() || "Pastoropeyemipeter";

function mimeTypeFor(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "mp3":
      return "audio/mpeg";
    case "m4a":
      return "audio/mp4";
    case "aac":
      return "audio/aac";
    case "wav":
      return "audio/wav";
    case "ogg":
    case "opus":
      return "audio/ogg";
    default:
      return "application/octet-stream";
  }
}

/**
 * Streams a Telegram channel audio attachment to the browser.
 *
 * No Range/206 support yet — the whole file is downloaded via GramJS and
 * returned in one response. Fine for play/pause; seeking into unbuffered
 * audio may restart playback from the top rather than jumping ahead.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const messageId = Number(params.id);
  if (!Number.isFinite(messageId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const client = await getTelegramClient();
    const messages = await client.getMessages(CHANNEL, { ids: [messageId] });
    const message = messages[0];
    const media = message?.media;

    if (!(media instanceof Api.MessageMediaDocument) || !(media.document instanceof Api.Document)) {
      return NextResponse.json({ error: "Audio not found" }, { status: 404 });
    }

    const doc = media.document;
    const filenameAttr = doc.attributes.find(
      (attr): attr is Api.DocumentAttributeFilename => attr instanceof Api.DocumentAttributeFilename
    );
    const filename = filenameAttr?.fileName ?? `${messageId}.mp3`;
    const mimeType = doc.mimeType || mimeTypeFor(filename);

    const buffer = await client.downloadMedia(message, {});
    if (!buffer) {
      return NextResponse.json({ error: "Download failed" }, { status: 502 });
    }

    const bytes = new Uint8Array(buffer as Buffer);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=86400, immutable",
        "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
      },
    });
  } catch (err) {
    console.error("[telegram-audio] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to fetch audio" }, { status: 502 });
  }
}
