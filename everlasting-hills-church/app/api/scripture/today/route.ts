import { NextRequest, NextResponse } from "next/server";
import { resolveDailyScripture } from "@/lib/scripture/daily-scripture";
import { readPublicApi } from "@/lib/scripture/api-reader";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Today's scripture for everyone: the homepage and the member dashboard.
 * Answered by the API when it can, otherwise from the website's own copy, so
 * the verse still shows while the API is starting, down, or out of date.
 */
export async function GET(request: NextRequest) {
  const translation = request.nextUrl.searchParams.get("translation")?.trim() || undefined;
  const result = await resolveDailyScripture(readPublicApi, translation);

  if (!result) {
    return NextResponse.json(
      { error: { message: "That Bible version isn't available. Choose another version." } },
      { status: 404, headers: { "cache-control": "no-store" } },
    );
  }

  return NextResponse.json(result.value, {
    headers: {
      // The verse changes at midnight in Lagos; five minutes at the edge is the
      // same allowance the API gives itself.
      "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=300",
      "x-scripture-source": result.source,
    },
  });
}
