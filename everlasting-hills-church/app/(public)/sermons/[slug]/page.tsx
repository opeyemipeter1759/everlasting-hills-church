import { notFound } from "next/navigation";
import { getSermonBySlug } from "@/services/sermon.service";
import { getCurrentUser } from "@/lib/auth/session";
import { getMemberContext } from "@/services/sermon.service";
import SermonDetail from "@/components/sermons/SermonDetail";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const sermon = await getSermonBySlug(params.slug);
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

export default async function SermonPage({ params }: { params: { slug: string } }) {
  const sermon = await getSermonBySlug(params.slug);
  if (!sermon || sermon.status !== "PUBLISHED") notFound();

  const user = await getCurrentUser();
  const memberCtx = user ? await getMemberContext(user.id, sermon.id) : null;

  return (
    <SermonDetail
      sermon={{
        id: sermon.id,
        title: sermon.title,
        slug: sermon.slug,
        speaker: sermon.speaker,
        date: sermon.date.toISOString(),
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
        _count: sermon._count,
        discussion: sermon.discussion.map((q) => ({
          id: q.id,
          question: q.question,
          order: q.order,
          responses: q.responses.map((r) => ({
            id: r.id,
            content: r.content,
            createdAt: r.createdAt.toISOString(),
            member: { firstName: r.member.firstName, lastName: r.member.lastName, photoUrl: r.member.photoUrl },
          })),
        })),
      }}
      memberCtx={memberCtx ? {
        memberId: memberCtx.memberId,
        reaction: memberCtx.reaction ? { type: memberCtx.reaction.type } : null,
        bookmarked: !!memberCtx.bookmark,
        note: memberCtx.note?.content ?? "",
        positionSec: memberCtx.progress?.positionSec ?? 0,
      } : null}
      isLoggedIn={!!user}
    />
  );
}
