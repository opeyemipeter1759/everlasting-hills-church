import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation';

const API = 'https://www.googleapis.com/youtube/v3';

/** Anything this short is a Short or a clip, never a service. */
const MAX_SHORT_SECONDS = 3 * 60;
/** Without a services playlist, an upload this long (or a past live stream) may be a service. */
const MIN_SERVICE_SECONDS = 20 * 60;
/** How far back into the channel's uploads each check looks. */
const LOOKBACK = 25;

/**
 * Titles of things the channel posts that are not full services. The channel
 * tags reels "#gospelshorts", so a hashtag ending in "shorts" counts too.
 */
const NOT_A_SERVICE_TITLE =
  /\b(shorts?|reels?|clips?|trailers?|teasers?|promos?|highlights?|snippets?|songs?|music\s+videos?|announcements?)\b|#\w*shorts?\b/i;

export type ServiceDay = 'SUNDAY' | 'WEDNESDAY' | 'OTHER';

export interface ServiceVideo {
  id: string;
  title: string;
  /** When the service began: the live stream's start, else the upload time. */
  startedAt: Date;
  durationSeconds: number;
  serviceDay: ServiceDay;
  /**
   * "ready": public and fully processed, so Gemini can watch it.
   * "pending": still live, scheduled, or still processing — look again next run.
   */
  state: 'ready' | 'pending';
}

/** The fields of a videos.list item this code reads. */
export interface YouTubeVideoItem {
  id: string;
  snippet: { title: string; publishedAt: string; liveBroadcastContent?: string };
  contentDetails?: { duration?: string };
  status?: { uploadStatus?: string; privacyStatus?: string };
  liveStreamingDetails?: { actualStartTime?: string; actualEndTime?: string };
}

/** "PT1H32M5S" → 5525. Live streams in progress report "P0D" → 0. */
export function parseIsoDuration(iso: string | undefined): number {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(iso ?? '');
  if (!m) return 0;
  const [, d, h, min, s] = m.map((v) => Number(v ?? 0));
  return Math.round(d * 86400 + h * 3600 + min * 60 + s);
}

export function lagosServiceDay(date: Date): ServiceDay {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Lagos', weekday: 'long' }).format(date);
  return weekday === 'Sunday' ? 'SUNDAY' : weekday === 'Wednesday' ? 'WEDNESDAY' : 'OTHER';
}

/**
 * Decides whether a video could be a full service, using only what YouTube
 * says about it (the sermon check with Gemini comes later). Null means "never
 * a service": a Short, a clip, a song, a private video, anything not
 * streamed or posted on a Sunday or Wednesday.
 *
 * With a services playlist the playlist itself is the filter; without one, only
 * past live streams and long uploads count. Title words and Shorts are always
 * excluded.
 */
export function toServiceVideo(item: YouTubeVideoItem, fromServicesPlaylist: boolean): ServiceVideo | null {
  const title = item.snippet.title;
  if (NOT_A_SERVICE_TITLE.test(title)) return null;

  const live = item.snippet.liveBroadcastContent;
  const startedAt = new Date(item.liveStreamingDetails?.actualStartTime ?? item.snippet.publishedAt);
  const durationSeconds = parseIsoDuration(item.contentDetails?.duration);
  const serviceDay = lagosServiceDay(startedAt);
  // Sunday and Wednesday services only — not home-cell lives or midweek uploads.
  if (serviceDay === 'OTHER') return null;
  const base = { id: item.id, title, startedAt, durationSeconds, serviceDay };

  // Live now, scheduled, or YouTube still processing the recording: not a
  // failure, just not yet.
  if (live === 'live' || live === 'upcoming' || (item.status?.uploadStatus && item.status.uploadStatus !== 'processed') || durationSeconds === 0) {
    return { ...base, state: 'pending' };
  }
  // Gemini can only watch public videos.
  if (item.status?.privacyStatus && item.status.privacyStatus !== 'public') return null;
  if (durationSeconds <= MAX_SHORT_SECONDS) return null;

  const wasLive = Boolean(item.liveStreamingDetails?.actualEndTime);
  if (!fromServicesPlaylist && !wasLive && durationSeconds < MIN_SERVICE_SECONDS) return null;

  return { ...base, state: 'ready' };
}

/** Reads the church channel's recent uploads (or its services playlist) from the YouTube Data API. */
@Injectable()
export class YouTubeServices {
  private readonly apiKey?: string;
  private readonly channelId?: string;
  private readonly playlistId?: string;

  constructor(config: ConfigService<Env, true>) {
    this.apiKey = config.get('YOUTUBE_API_KEY', { infer: true });
    this.channelId = config.get('YOUTUBE_CHANNEL_ID', { infer: true });
    this.playlistId = config.get('YOUTUBE_SERVICES_PLAYLIST_ID', { infer: true });
  }

  get configured(): boolean {
    return Boolean(this.apiKey && (this.playlistId || this.channelId));
  }

  /** Possible services, newest first. Costs 2–3 units of the 10,000/day YouTube quota. */
  async recentServices(): Promise<ServiceVideo[]> {
    const playlist = this.playlistId ?? (await this.uploadsPlaylist());
    const items = await this.get<{ items?: { contentDetails: { videoId: string } }[] }>('playlistItems', {
      part: 'contentDetails',
      playlistId: playlist,
      maxResults: String(LOOKBACK),
    });
    const ids = (items.items ?? []).map((i) => i.contentDetails.videoId);
    if (ids.length === 0) return [];

    const videos = await this.get<{ items?: YouTubeVideoItem[] }>('videos', {
      part: 'snippet,contentDetails,status,liveStreamingDetails',
      id: ids.join(','),
    });
    return (videos.items ?? [])
      .map((v) => toServiceVideo(v, Boolean(this.playlistId)))
      .filter((v): v is ServiceVideo => v !== null)
      // A hand-made playlist isn't in date order; the uploads list is, but sorting costs nothing.
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  private async uploadsPlaylist(): Promise<string> {
    const res = await this.get<{ items?: { contentDetails: { relatedPlaylists: { uploads: string } } }[] }>('channels', {
      part: 'contentDetails',
      id: this.channelId as string,
    });
    const uploads = res.items?.[0]?.contentDetails.relatedPlaylists.uploads;
    if (!uploads) throw new Error(`YouTube channel ${this.channelId} not found`);
    return uploads;
  }

  private async get<T>(resource: string, params: Record<string, string>): Promise<T> {
    const query = new URLSearchParams({ ...params, key: this.apiKey as string });
    const res = await fetch(`${API}/${resource}?${query}`, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      throw new Error(`YouTube ${resource} ${res.status}: ${body?.error?.message ?? res.statusText}`);
    }
    return (await res.json()) as T;
  }
}
