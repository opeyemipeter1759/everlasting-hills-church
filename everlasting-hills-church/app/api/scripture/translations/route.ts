import { NextResponse } from "next/server";
import { resolveScriptureTranslations } from "@/lib/scripture/daily-scripture";
import { readPublicApi } from "@/lib/scripture/api-reader";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Bible versions the daily scripture can be read and shared in. */
export async function GET() {
  const result = await resolveScriptureTranslations(readPublicApi);
  return NextResponse.json(result.value, {
    headers: {
      "cache-control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      "x-scripture-source": result.source,
    },
  });
}
