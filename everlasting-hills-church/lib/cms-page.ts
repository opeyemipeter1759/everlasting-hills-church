/**
 * Server helper: read a structured CMS page's content (published, or a draft via
 * a preview token), falling back to the page's current bundled content so the
 * public site never breaks. Cached per-route with the page's CMS cache tag.
 */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  process.env.API_BASE_URL?.trim() ||
  "http://localhost:4000";

export async function getStructuredContent<T>(
  key: string,
  opts: { preview?: string; fallback: T; valid: (c: unknown) => c is T },
): Promise<T> {
  try {
    const url = opts.preview
      ? `${BASE_URL}/cms/preview?token=${encodeURIComponent(opts.preview)}`
      : `${BASE_URL}/cms/public/${encodeURIComponent(key)}`;
    const res = await fetch(
      url,
      opts.preview ? { cache: "no-store" } : { next: { revalidate: 300, tags: [`cms:${key}`] } },
    );
    if (!res.ok) return opts.fallback;
    const body = (await res.json()) as { data?: { content?: unknown } };
    const content = body?.data?.content;
    return opts.valid(content) ? content : opts.fallback;
  } catch {
    return opts.fallback;
  }
}
