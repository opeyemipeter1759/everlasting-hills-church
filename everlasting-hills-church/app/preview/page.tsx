import BlockRenderer from "@/components/dashboard/admin/cms/BlockRenderer";
import type { Block } from "@/components/dashboard/admin/cms/cms-blocks";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preview — Everlasting Hills", robots: { index: false } };

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  process.env.API_BASE_URL?.trim() ||
  "http://localhost:4000";

interface PreviewData {
  title?: string;
  content?: { blocks?: Block[] };
}

/**
 * Public preview of unpublished CMS draft content, gated by a signed 1-hour token
 * (minted from the editor). Never indexed.
 */
export default async function PreviewPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  if (!token) return <PreviewError msg="Missing preview token." />;

  let data: PreviewData | null = null;
  try {
    const res = await fetch(`${BASE_URL}/cms/preview?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    if (!res.ok) return <PreviewError msg="This preview link is invalid or has expired." />;
    const body = (await res.json()) as { data?: PreviewData };
    data = body.data ?? null;
  } catch {
    return <PreviewError msg="Could not load the preview." />;
  }

  const blocks = Array.isArray(data?.content?.blocks) ? (data!.content!.blocks as Block[]) : [];

  return (
    <main className="min-h-screen bg-white">
      <div className="bg-[#87102C] text-white text-center text-xs font-semibold py-2 tracking-wide">
        PREVIEW — {data?.title ?? "Draft"} · not published
      </div>
      <div className="max-w-3xl mx-auto px-5 py-12">
        <BlockRenderer blocks={blocks} />
      </div>
    </main>
  );
}

function PreviewError({ msg }: { msg: string }) {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="text-center">
        <p className="text-lg font-bold text-[#111]">Preview unavailable</p>
        <p className="text-sm text-[#666] mt-1">{msg}</p>
      </div>
    </main>
  );
}
