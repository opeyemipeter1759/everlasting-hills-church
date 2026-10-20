import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation';
import { parseIsoDuration } from '../sermon-digest/youtube-services';

/**
 * Where a lesson video lives. The watch rules need to know how long a video is
 * and must never take that from a learner's browser. Today the videos are on
 * YouTube; moving them to a host of our own (Cloudflare Stream, or HLS from R2)
 * means adding one more class that implements this, not changing the lessons.
 */
export interface VideoSource {
  /** Length of the video in whole seconds, or null when it cannot be found. */
  durationSeconds(videoUrl: string): Promise<number | null>;
}

export const VIDEO_SOURCE = Symbol('VIDEO_SOURCE');

/** The id in a YouTube watch, share, shorts, live or embed link; null for any other address. */
export function youTubeIdOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    let id: string | null = null;
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
    else if (u.hostname === 'youtube.com' || u.hostname.endsWith('.youtube.com')) {
      id = u.searchParams.get('v') ?? u.pathname.match(/\/(embed|shorts|live)\/([^/?]+)/)?.[2] ?? null;
    }
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

@Injectable()
export class YouTubeVideoSource implements VideoSource {
  private readonly logger = new Logger(YouTubeVideoSource.name);
  private readonly apiKey?: string;

  constructor(config: ConfigService<Env, true>) {
    this.apiKey = config.get('YOUTUBE_API_KEY', { infer: true });
  }

  async durationSeconds(videoUrl: string): Promise<number | null> {
    const id = youTubeIdOf(videoUrl);
    if (!id || !this.apiKey) return null;
    try {
      const query = new URLSearchParams({ part: 'contentDetails', id, key: this.apiKey });
      const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${query}`, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) {
        this.logger.warn(`YouTube length lookup failed with ${res.status}`);
        return null;
      }
      const body = (await res.json()) as { items?: { contentDetails?: { duration?: string } }[] };
      const seconds = parseIsoDuration(body.items?.[0]?.contentDetails?.duration);
      return seconds > 0 ? seconds : null;
    } catch (err) {
      this.logger.warn(`YouTube length lookup failed: ${(err as Error).message}`);
      return null;
    }
  }
}
