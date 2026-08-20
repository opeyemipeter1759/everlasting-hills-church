import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";

/**
 * On-publish ISR revalidation, called server-to-server by the NestJS CMS after a
 * publish / unpublish / rollback / site-settings save. The secret lives only in
 * env on both ends — it is never exposed to the browser.
 *
 * Body: { tags?: string[]; paths?: string[] }
 */
function hasValidSecret(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return (
    providedBytes.length === expectedBytes.length &&
    timingSafeEqual(providedBytes, expectedBytes)
  );
}

export async function POST(req: NextRequest) {
  const secret = process.env.CMS_REVALIDATE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "revalidation unavailable" },
      { status: 503 },
    );
  }

  const provided = req.headers.get("x-revalidate-secret");
  if (!hasValidSecret(provided, secret)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { tags?: unknown; paths?: unknown };
  try {
    body = (await req.json()) as { tags?: unknown; paths?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const tags = (Array.isArray(body.tags) ? body.tags : [])
    .filter((tag): tag is string => typeof tag === "string" && tag.length > 0 && tag.length <= 128)
    .slice(0, 100);
  const paths = (Array.isArray(body.paths) ? body.paths : [])
    .filter((path): path is string => (
      typeof path === "string" && path.startsWith("/") && !path.startsWith("//") && path.length <= 2048
    ))
    .slice(0, 100);

  for (const tag of tags) revalidateTag(tag);
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ ok: true, revalidated: { tags, paths } });
}
