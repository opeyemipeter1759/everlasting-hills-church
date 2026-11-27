import { NextResponse } from "next/server";

/** The build this server is running, so an open app can tell a newer one is out. Never cached. */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { build: process.env.NEXT_PUBLIC_BUILD_ID ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
