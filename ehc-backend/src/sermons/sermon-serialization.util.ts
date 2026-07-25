import { SermonType } from '@prisma/client';
import slugify from 'slugify';

export type SermonEpisodeLike = {
  id: string;
  title: string;
  url: string;
  duration: number;
  order: number;
};

export type SermonEpisodeInputLike = {
  id?: string;
  title: string;
  url: string;
  duration: number;
  order?: number;
};

export type SermonLike = {
  id: string;
  type?: SermonType;
  audioUrl?: string | null;
  videoUrl?: string | null;
  audioDuration?: number | null;
  series?: string | null;
  seriesSlug?: string | null;
  isFeatured?: boolean;
  Episodes?: SermonEpisodeLike[];
  [key: string]: unknown;
};

export const SERMON_COUNTS_INCLUDE = {
  _count: { select: { SermonReaction: true, SermonBookmark: true, SermonComment: true } },
} as const;

export const SERMON_EPISODES_INCLUDE = {
  Episodes: { orderBy: { order: 'asc' } },
} as const;

export function serializeEpisode(episode: SermonEpisodeLike) {
  return {
    id: episode.id,
    title: episode.title,
    url: episode.url,
    duration: episode.duration,
    order: episode.order,
  };
}

export function serializeSermon(sermon: SermonLike) {
  const { Episodes, ...rest } = sermon;
  const episodes = (Episodes ?? []).map(serializeEpisode);
  // `series`/`seriesSlug` are just a topical label a SINGLE sermon can also carry
  // (e.g. grouping standalone messages under a named collection) — they are NOT
  // proof of being a multi-episode series, so only `type` and real episode count
  // decide `isSeries`.
  const isSeries = sermon.type === SermonType.SERIES || episodes.length > 0;

  return {
    ...rest,
    // Re-derive `type` from the same signal used for `isSeries` above, instead
    // of passing through the raw DB column — sermons with real episodes but a
    // stale/unset `type` column were otherwise reporting as SINGLE.
    type: isSeries ? SermonType.SERIES : SermonType.SINGLE,
    url: isSeries ? null : sermon.audioUrl ?? sermon.videoUrl ?? null,
    duration: isSeries ? null : sermon.audioDuration ?? null,
    episodes: isSeries ? episodes : [],
  };
}

export function resolveSeriesType(data: { type?: SermonType; episodes?: SermonEpisodeInputLike[] }) {
  return data.type ?? (data.episodes?.length ? SermonType.SERIES : SermonType.SINGLE);
}

export function resolveSingleUrl(data: { url?: string; audioUrl?: string; videoUrl?: string }) {
  return data.url ?? data.audioUrl ?? data.videoUrl ?? undefined;
}

export function resolveSingleDuration(data: { duration?: number; audioDuration?: number }) {
  return data.duration ?? data.audioDuration ?? undefined;
}

export function makeSlug(title: string, date: string | Date): string {
  const sermonDate = new Date(date);
  const suffix = `${sermonDate.getFullYear()}-${String(sermonDate.getMonth() + 1).padStart(2, '0')}`;
  return slugify(`${title}-${suffix}`, { lower: true, strict: true });
}
