/**
 * Sermon shapes returned by the NestJS sermons module.
 *
 * Why these live here (not generated): we're hand-rolling until `npm run gen:api`
 * is wired to a running backend. Once the codegen pipeline produces
 * lib/api/generated/schema.d.ts, swap these for `paths[...]["get"]["responses"]...`.
 *
 * Prisma relation names leak today (`_count.SermonReaction` etc.). A backend
 * view-model pass (Week 4) will rename to `_count.reactions` / `_count.bookmarks`.
 * Pages do the mapping inline until then.
 */

export interface SermonCountRaw {
  SermonReaction: number;
  SermonBookmark: number;
}

export interface SermonCountUi {
  reactions: number;
  bookmarks: number;
}

export interface SermonListItemRaw {
  id: string;
  title: string;
  slug: string;
  speaker: string;
  date: string;
  scriptureRef: string | null;
  series: string | null;
  seriesSlug: string | null;
  description: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  playCount: number;
  tags: string[];
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  _count: SermonCountRaw;
}

export interface SermonListItemUi {
  id: string;
  title: string;
  slug: string;
  speaker: string;
  date: string;
  scriptureRef: string | null;
  series: string | null;
  seriesSlug: string | null;
  description: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  playCount: number;
  tags: string[];
  _count: SermonCountUi;
}

export interface SeriesListItem {
  series: string | null;
  seriesSlug: string | null;
  date: string;
}

export interface DiscussionResponseRaw {
  id: string;
  content: string;
  createdAt: string;
  Member: { firstName: string; lastName: string; photoUrl: string | null };
}

export interface DiscussionQuestionRaw {
  id: string;
  question: string;
  order: number;
  DiscussionResponse: DiscussionResponseRaw[];
}

export interface SermonDetailRaw extends SermonListItemRaw {
  transcript: string | null;
  DiscussionQuestion: DiscussionQuestionRaw[];
}

export interface MemberSermonContext {
  memberId: string;
  reaction: { type: string } | null;
  bookmark: { id: string } | null;
  note: { content: string } | null;
  progress: { positionSec: number } | null;
}

export function toUiCount(raw: SermonCountRaw): SermonCountUi {
  return { reactions: raw.SermonReaction, bookmarks: raw.SermonBookmark };
}

export function toUiSermon(raw: SermonListItemRaw): SermonListItemUi {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    speaker: raw.speaker,
    date: raw.date,
    scriptureRef: raw.scriptureRef,
    series: raw.series,
    seriesSlug: raw.seriesSlug,
    description: raw.description,
    audioUrl: raw.audioUrl,
    videoUrl: raw.videoUrl,
    thumbnailUrl: raw.thumbnailUrl,
    playCount: raw.playCount,
    tags: raw.tags,
    _count: toUiCount(raw._count),
  };
}
