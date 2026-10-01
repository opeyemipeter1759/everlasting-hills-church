import { NextResponse, type NextRequest } from "next/server";
import { getBackendBaseUrl } from "@/lib/api/backend-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * One-click unsubscribe (RFC 8058): Gmail and Yahoo POST here from their own
 * "Unsubscribe" button, using the List-Unsubscribe header on the daily
 * fasting email. The address and its signed token come in the query string.
 */
export async function POST(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("e") ?? "";
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const res = await fetch(`${getBackendBaseUrl()}/email/unsubscribe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, token }),
    cache: "no-store",
  }).catch(() => null);
  return NextResponse.json({ ok: !!res?.ok }, { status: res?.ok ? 200 : 400 });
}
