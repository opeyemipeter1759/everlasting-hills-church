import { proxySermonDigest } from "@/lib/sermon-digest-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Word of the Day from the latest sermon, or `{ ready: false }`. */
export function GET() {
  return proxySermonDigest("/sermon-digest/word-of-the-day");
}
