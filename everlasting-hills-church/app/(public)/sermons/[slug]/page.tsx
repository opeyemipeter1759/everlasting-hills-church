import { notFound } from "next/navigation";
import SermonDetail from "@/components/sermons/SermonDetail";
import { serverApi, type ApiError } from "@/lib/api/server";
import {
  toWatchSermon,
  type MemberSermonContext,
  type SermonDetailRaw,
} from "@/lib/api/sermon-types";

export const dynamic = "force-dynamic";

export default async function PublicSermonPage({
  params,
}: {
  params: { slug: string };
}) {
  let raw: SermonDetailRaw;

  try {
    raw = await serverApi.get<SermonDetailRaw>(
      `/sermons/slug/${encodeURIComponent(params.slug)}`,
      { withAuth: false, cache: "no-store" },
    );
  } catch (error) {
    if ((error as ApiError).status === 404) notFound();
    throw error;
  }

  // Authentication enriches the public page, but a stale/missing session must
  // never prevent an anonymous visitor from watching a published sermon.
  let memberCtx: MemberSermonContext | null = null;
  try {
    memberCtx = await serverApi.get<MemberSermonContext>(
      `/sermons/me/${raw.id}/context`,
      { cache: "no-store" },
    );
  } catch {
    memberCtx = null;
  }

  return (
    <SermonDetail
      sermon={toWatchSermon(raw)}
      memberCtx={memberCtx}
      isLoggedIn={memberCtx !== null}
    />
  );
}
