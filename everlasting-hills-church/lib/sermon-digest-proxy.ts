import { NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/api/backend-url";

/**
 * Longer than the scripture routes' 3s: there is no bundled fallback here, and
 * the API may be waking from zero.
 */
const TIMEOUT_MS = 8000;

/**
 * Cache-Control for the digest: a few minutes at most, and never past the
 * coming midnight in Lagos, when the day's confession changes — so the new
 * one shows straight away. (Lagos is UTC+1 all year.) Same rule as the API.
 */
export function dailyCacheControl(now = new Date()): string {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(now);
  const nextMidnight = Date.parse(`${ymd}T00:00:00+01:00`) + 86_400_000;
  const untilMidnight = Math.max(1, Math.floor((nextMidnight - now.getTime()) / 1000));
  const cap = (seconds: number) => Math.min(seconds, untilMidnight);
  return `public, max-age=${cap(60)}, s-maxage=${cap(300)}, stale-while-revalidate=${cap(60)}`;
}

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
      // Today's confession changes at Lagos midnight: never cache past it.
      headers: { "cache-control": dailyCacheControl() },
    });
  } catch (error) {
    console.error(`[sermon-digest ${path}]`, error);
    return NextResponse.json({ ready: false }, { headers: { "cache-control": "no-store" } });
  }
}
