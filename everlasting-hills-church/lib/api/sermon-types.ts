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

/**
 * Single source of truth for sermon status literals.
 * Mirrors `SermonStatus` from @prisma/client — declared as a const tuple here so the
 * frontend doesn't need to import Prisma's client (it doesn't run Prisma).
 */
export const SERMON_STATUSES = ['DRAFT', 'PUBLISHED', 'SCHEDULED'] as const;
export type SermonStatus = (typeof SERMON_STATUSES)[number];

/** Mirrors `SermonType` from @prisma/client. A sermon can be type SERIES (has episodes)
 * independent of whether it's also tagged with a `series` grouping name. */
export const SERMON_TYPES = ['SINGLE', 'SERIES'] as const;
export type SermonTypeLiteral = (typeof SERMON_TYPES)[number];

export interface SermonCountRaw {
  SermonReaction: number;
  SermonBookmark: number;
  SermonComment: number;
}

export interface SermonCountUi {
  reactions: number;
  bookmarks: number;
  comments: number;
}

export interface SermonListItemRaw {
  id: string;
  title: string;
  slug: string;
  speaker: string;
  date: string;
  type: SermonTypeLiteral;
  scriptureRef: string | null;
  series: string | null;
  seriesSlug: string | null;
  description: string | null;
  audioUrl: string | null;
  audioDuration: number | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  playCount: number;
  tags: string[];
  status: SermonStatus;
  _count: SermonCountRaw;
}

export interface SermonListItemUi {
  id: string;
  title: string;
  slug: string;
  speaker: string;
  date: string;
  type: SermonTypeLiteral;
  scriptureRef: string | null;
  series: string | null;
  seriesSlug: string | null;
  description: string | null;
  audioUrl: string | null;
  audioDuration: number | null;
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
  memberId: string;
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

/** The three reactions the backend accepts (`ReactionDto`) — keep in sync with ehc-backend. */
export const REACTION_TYPES = ['LIKE', 'AMEN', 'CONVICTED'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export interface CommentAuthor {
  firstName: string;
  lastName: string;
  photoUrl: string | null;
}

export interface SermonComment {
  id: string;
  content: string;
  createdAt: string;
  memberId: string;
  member: CommentAuthor;
  replies: SermonComment[];
}

/** A person a member can address a note/question to — deliberately minimal (no email/phone). */
export interface MemberPickerResult {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
}

export const DIRECT_MESSAGE_TYPES = ['NOTE', 'QUESTION'] as const;
export type DirectMessageType = (typeof DIRECT_MESSAGE_TYPES)[number];

export interface SermonDirectMessage {
  id: string;
  type: DirectMessageType;
  content: string;
  createdAt: string;
  senderId: string;
  recipientId: string;
  sender: CommentAuthor;
  recipient: CommentAuthor;
  replies: SermonDirectMessage[];
}

export function toUiCount(raw: SermonCountRaw): SermonCountUi {
  return { reactions: raw.SermonReaction, bookmarks: raw.SermonBookmark, comments: raw.SermonComment };
}

/** "1h 12m" / "38 min" — used on sermon cards next to the audio badge. */
export function formatSermonDuration(seconds: number | null | undefined): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins} min`;
}

/** Shapes consumed by <SermonWatchPanel> — same on the SSR'd detail page and the client-fetched modal. */
export interface WatchDiscussionResponse {
  id: string;
  content: string;
  createdAt: string;
  memberId: string;
  member: CommentAuthor;
}

export interface WatchDiscussionQuestion {
  id: string;
  question: string;
  order: number;
  responses: WatchDiscussionResponse[];
}

export interface WatchSermon {
  id: string;
  title: string;
  slug: string;
  speaker: string;
  date: string;
  type: SermonTypeLiteral;
  scriptureRef: string | null;
  series: string | null;
  seriesSlug: string | null;
  description: string | null;
  transcript: string | null;
  audioUrl: string | null;
  audioDuration: number | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  playCount: number;
  tags: string[];
  _count: SermonCountUi;
  discussion: WatchDiscussionQuestion[];
}

export function toWatchSermon(raw: SermonDetailRaw): WatchSermon {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    speaker: raw.speaker,
    date: raw.date,
    type: raw.type,
    scriptureRef: raw.scriptureRef,
    series: raw.series,
    seriesSlug: raw.seriesSlug,
    description: raw.description,
    transcript: raw.transcript,
    audioUrl: raw.audioUrl,
    audioDuration: raw.audioDuration,
    videoUrl: raw.videoUrl,
    thumbnailUrl: raw.thumbnailUrl,
    playCount: raw.playCount,
    tags: raw.tags,
    _count: toUiCount(raw._count),
    discussion: raw.DiscussionQuestion.map((q) => ({
      id: q.id,
      question: q.question,
      order: q.order,
      responses: q.DiscussionResponse.map((r) => ({
        id: r.id,
        content: r.content,
        createdAt: r.createdAt,
        memberId: r.memberId,
        member: {
          firstName: r.Member.firstName,
          lastName: r.Member.lastName,
          photoUrl: r.Member.photoUrl,
        },
      })),
    })),
  };
}

export function toUiSermon(raw: SermonListItemRaw): SermonListItemUi {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    speaker: raw.speaker,
    date: raw.date,
    type: raw.type,
    scriptureRef: raw.scriptureRef,
    series: raw.series,
    seriesSlug: raw.seriesSlug,
    description: raw.description,
    audioUrl: raw.audioUrl,
    audioDuration: raw.audioDuration,
    videoUrl: raw.videoUrl,
    thumbnailUrl: raw.thumbnailUrl,
    playCount: raw.playCount,
    tags: raw.tags,
    _count: toUiCount(raw._count),
  };
}
