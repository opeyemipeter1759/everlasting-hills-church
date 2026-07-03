import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * On-publish ISR revalidation, called server-to-server by the NestJS CMS after a
 * publish / unpublish / rollback / site-settings save. The secret lives only in
 * env on both ends — it is never exposed to the browser.
 *
 * Body: { tags?: string[]; paths?: string[] }
 */
const SECRET =
  process.env.CMS_REVALIDATE_SECRET ??
  process.env.SUPABASE_JWT_SECRET ??
  "ehc-cms-revalidate";

export async function POST(req: NextRequest) {
  const provided = req.headers.get("x-revalidate-secret");
  if (!provided || provided !== SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { tags?: string[]; paths?: string[] } = {};
  try {
    body = (await req.json()) as { tags?: string[]; paths?: string[] };
  } catch {
    // empty / invalid body → nothing to revalidate
  }

  const tags = Array.isArray(body.tags) ? body.tags : [];
  const paths = Array.isArray(body.paths) ? body.paths : [];

  for (const t of tags) {
    if (typeof t === "string" && t) revalidateTag(t);
  }
  for (const p of paths) {
    if (typeof p === "string" && p) revalidatePath(p);
  }

  return NextResponse.json({ ok: true, revalidated: { tags, paths } });
}
