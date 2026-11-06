import { NextResponse } from "next/server";
import { fetchChannelVideos, YouTubeConfigError } from "@/lib/youtube-videos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** The church channel's uploads, fetched server side so the API key never reaches the browser. */
export async function GET() {
  try {
    const videos = await fetchChannelVideos();
    return NextResponse.json(
      { videos },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
    );
  } catch (err) {
    console.error("youtube-videos failed", err);
    const message =
      err instanceof YouTubeConfigError ? "Sermon videos are not configured yet." : "Couldn't load sermon videos right now.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
