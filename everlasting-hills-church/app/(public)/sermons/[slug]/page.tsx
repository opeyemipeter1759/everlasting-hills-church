import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import SermonDetail from "@/components/sermons/SermonDetail";
import { serverApi, type ApiError } from "@/lib/api/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/frontend-session";
import {
  MemberSermonContext,
  SermonDetailRaw,
  toUiCount,
} from "@/lib/api/sermon-types";

// Render on-demand; backend may not be reachable at build time
export const dynamic = "force-dynamic";

interface PageParams {
  params: { slug: string };
}

/**
 * Public sermon detail page.
 *
 * - Sermon body is public; we hit /sermons/slug/:slug unauthenticated.
 * - Member context (reaction/bookmark/note/progress) is auth-only; we attempt it only when
 *   the visitor has a JWT cookie. Silently swallow 401 (treats expired/bad tokens as "guest").
 * - Uses `notFound()` for missing slugs so Next.js renders the 404 boundary.
 */
async function fetchSermon(slug: string): Promise<SermonDetailRaw | null> {
  try {
    return await serverApi.get<SermonDetailRaw>(`/sermons/slug/${slug}`, {
      withAuth: false,
      revalidate: 60,
    });
  } catch (err) {
    if ((err as ApiError).status === 404) return null;
    throw err;
  }
}

async function fetchMemberContextIfSignedIn(
  sermonId: string,
): Promise<MemberSermonContext | null> {
  const hasToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!hasToken) return null;
  try {
    return await serverApi.get<MemberSermonContext>(
      `/sermons/me/${sermonId}/context`,
      { cache: "no-store" },
    );
  } catch (err) {
    // 401/403 = visitor isn't actually signed in despite cookie; treat as guest
    const status = (err as ApiError).status;
    if (status === 401 || status === 403) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: PageParams) {
  const sermon = await fetchSermon(params.slug);
  if (!sermon) return {};
  return {
    title: `${sermon.title} — Everlasting Hills Church`,
    description: sermon.description ?? `${sermon.speaker} · ${sermon.scriptureRef ?? ""}`,
    openGraph: {
      title: sermon.title,
      description: sermon.description ?? undefined,
      images: sermon.thumbnailUrl ? [sermon.thumbnailUrl] : [],
    },
  };
}

export default async function SermonPage({ params }: PageParams) {
  const sermon = await fetchSermon(params.slug);
  if (!sermon || sermon.status !== "PUBLISHED") notFound();

  const memberCtx = await fetchMemberContextIfSignedIn(sermon.id);

  return (
    <SermonDetail
      sermon={{
        id: sermon.id,
        title: sermon.title,
        slug: sermon.slug,
        speaker: sermon.speaker,
        date: sermon.date,
        scriptureRef: sermon.scriptureRef,
        series: sermon.series,
        seriesSlug: sermon.seriesSlug,
        description: sermon.description,
        transcript: sermon.transcript,
        audioUrl: sermon.audioUrl,
        videoUrl: sermon.videoUrl,
        thumbnailUrl: sermon.thumbnailUrl,
        playCount: sermon.playCount,
        tags: sermon.tags,
        _count: toUiCount(sermon._count),
        discussion: sermon.DiscussionQuestion.map((q) => ({
          id: q.id,
          question: q.question,
          order: q.order,
          responses: q.DiscussionResponse.map((r) => ({
            id: r.id,
            content: r.content,
            createdAt: r.createdAt,
            member: {
              firstName: r.Member.firstName,
              lastName: r.Member.lastName,
              photoUrl: r.Member.photoUrl,
            },
          })),
        })),
      }}
      memberCtx={
        memberCtx
          ? {
              memberId: memberCtx.memberId,
              reaction: memberCtx.reaction ? { type: memberCtx.reaction.type } : null,
              bookmarked: !!memberCtx.bookmark,
              note: memberCtx.note?.content ?? "",
              positionSec: memberCtx.progress?.positionSec ?? 0,
            }
          : null
      }
      isLoggedIn={!!memberCtx}
    />
  );
}
