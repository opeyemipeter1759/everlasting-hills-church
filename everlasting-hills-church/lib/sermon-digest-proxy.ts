import { NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/api/backend-url";

/**
 * Longer than the scripture routes' 3s: there is no bundled fallback here, and
 * the API may be waking from zero.
 */
const TIMEOUT_MS = 8000;

/**
 * Serves one of the API's public sermon-digest reads. Whatever goes wrong —
 * API asleep, down, or nothing summarised yet — the page gets `ready: false`
 * and shows its friendly "not ready yet" message rather than an error.
 */
export async function proxySermonDigest(path: string) {
  try {
    const response = await fetch(`${getBackendBaseUrl()}${path}`, {
      headers: { accept: "application/json" },
      // Always ask the API; the cache-control header below lets the CDN do the caching.
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`API answered ${response.status}`);
    const body = (await response.json()) as { data?: unknown } | null;
    const data = body && typeof body === "object" && "data" in body ? body.data : body;
    return NextResponse.json(data, {
      // A new sermon lands at most every few hours.
      headers: { "cache-control": "public, max-age=60, s-maxage=600, stale-while-revalidate=3600" },
    });
  } catch (error) {
    console.error(`[sermon-digest ${path}]`, error);
    return NextResponse.json({ ready: false }, { headers: { "cache-control": "no-store" } });
  }
}
