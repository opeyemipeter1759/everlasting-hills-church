import { proxySermonDigest } from "@/lib/sermon-digest-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Summary of the latest sermon from the church YouTube channel, or `{ ready: false }`. */
export function GET() {
  return proxySermonDigest("/sermon-digest/latest");
}
