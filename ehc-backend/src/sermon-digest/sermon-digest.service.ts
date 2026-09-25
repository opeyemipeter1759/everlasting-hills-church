import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SermonDigest } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiBusyError, GeminiClient, GeminiContent, parseGeminiJson } from '../ai/gemini-client';
import { ServiceVideo, YouTubeServices } from './youtube-services';
import {
  DAILY_CONFESSIONS_SCHEMA,
  DIGEST_SCHEMA,
  DigestAnswer,
  dailyConfessionsAnswer,
  dailyConfessionsPrompt,
  LOCATE_SCHEMA,
  LocateAnswer,
  WordOfTheDay,
  digestAnswer,
  digestPrompt,
  locateAnswer,
  locatePrompt,
} from './sermon-digest.prompts';
import type { Env } from '../config/env.validation';

/**
 * Flash models only: a sermon summary is worth waiting three hours for, a
 * lite model's guess at one is not. Newest first, per Google's model list.
 */
const VIDEO_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash'];
/** Newest candidate services looked at per run. */
const MAX_CANDIDATES = 5;
/** Preaching shorter than this isn't a sermon worth a Word of the Day. */
const MIN_SERMON_SECONDS = 10 * 60;
/** A video that keeps failing (not busy — failing) is given up on after this many runs. */
const MAX_ATTEMPTS = 3;
/**
 * Stop starting new videos after this long, so a run finishes inside Cloud
 * Scheduler's 300s deadline; anything left is picked up next run.
 */
const RUN_BUDGET_MS = 150_000;
/**
 * Frames per second sent to Gemini. The words carry a sermon, so a frame every
 * five seconds is plenty (enough to catch a verse on screen) and keeps a
 * three-hour service near 45 tokens a second, well inside the model's context.
 */
const VIDEO_FPS = 0.2;

type Outcome = 'ready' | 'rejected' | 'failed' | 'busy';

export interface SermonDigestView {
  videoId: string;
  videoTitle: string;
  serviceDay: string;
  serviceDate: string;
  sermonTitle: string;
  preacher: string;
  bibleReferences: string[];
  summary: string;
  keyPoints: string[];
  wordOfTheDay: WordOfTheDay;
  /** Opens the video where the sermon begins. */
  watchUrl: string;
  /** 1 on the service day, 2 the day after, …: which daily confession is showing. */
  confessionDay: number;
  sermonStartSeconds: number;
  sermonEndSeconds: number;
  generatedAt: string;
}

export interface SermonDigestRunResult {
  processed: { videoId: string; outcome: Outcome; detail?: string }[];
  skipped?: string;
}

/**
 * Sermon digest: every few hours, finds the church's newest full service on
 * YouTube, asks Gemini where the sermon is (cheaply, at low frame rate and
 * resolution), then asks for a faithful summary and a Word of the Day from the
 * sermon alone. Every answer — including "this isn't a service" — is saved, so
 * no video is sent to Gemini twice and the latest sermon survives restarts.
 */
@Injectable()
export class SermonDigestService {
  private readonly logger = new Logger(SermonDigestService.name);
  private readonly tenantId: string;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiClient,
    private readonly youtube: YouTubeServices,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async run(): Promise<SermonDigestRunResult> {
    if (!this.gemini.enabled) return this.skip('GEMINI_API_KEY is not set');
    if (!this.youtube.configured) return this.skip('YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID (or YOUTUBE_SERVICES_PLAYLIST_ID) are not set');
    if (this.running) return this.skip('a run is already in progress');

    this.running = true;
    const started = Date.now();
    const processed: SermonDigestRunResult['processed'] = [];
    try {
      const candidates = (await this.youtube.recentServices()).slice(0, MAX_CANDIDATES);
      const seen = await this.prisma.sermonDigest.findMany({
        where: { tenantId: this.tenantId, videoId: { in: candidates.map((c) => c.id) } },
      });
      const byId = new Map(seen.map((row) => [row.videoId, row]));

      for (const video of candidates) {
        const row = byId.get(video.id);
        if (row?.status === 'READY') break; // the newest service is already done
        if (video.state === 'pending') {
          this.logger.log(`sermon-digest: "${video.title}" is still live or processing — next run`);
          continue;
        }
        if (row?.status === 'REJECTED') continue;
        if (row?.status === 'FAILED' && row.attempts >= MAX_ATTEMPTS) continue;
        if (Date.now() - started > RUN_BUDGET_MS) {
          this.logger.log('sermon-digest: out of time for this run — the rest next run');
          break;
        }

        const { outcome, detail } = await this.process(video, row);
        processed.push({ videoId: video.id, outcome, detail });
        this.logger.log(`sermon-digest: ${video.id} "${video.title}" → ${outcome}${detail ? ` (${detail})` : ''}`);
        if (outcome === 'ready' || outcome === 'busy') break;
      }
      await this.ensureDailyConfessions();
      return { processed };
    } finally {
      this.running = false;
    }
  }

  /** The newest sermon that has a summary, or null before the first one. */
  async latest(): Promise<SermonDigestView | null> {
    const row = await this.prisma.sermonDigest.findFirst({
      where: { tenantId: this.tenantId, status: 'READY' },
      orderBy: { publishedAt: 'desc' },
    });
    return row ? toView(row) : null;
  }

  private async process(video: ServiceVideo, previous: SermonDigest | undefined): Promise<{ outcome: Outcome; detail?: string }> {
    const url = `https://www.youtube.com/watch?v=${video.id}`;
    let model: string | undefined;
    try {
      // Step 1: the whole service, as cheaply as Gemini can take it, only to find the sermon.
      const located = await this.ask<LocateAnswer>(
        [
          { type: 'video', uri: url, resolution: 'low', processing: { type: 'static', fps: VIDEO_FPS } },
          { type: 'text', text: locatePrompt(video.title) },
        ],
        LOCATE_SCHEMA,
        locateAnswer.parse,
        'low', // finding the sermon is listening, not reasoning
      );
      model = located.model;
      const loc = located.answer;
      const end = Math.min(loc.sermonEndSeconds, video.durationSeconds);
      const start = Math.min(loc.sermonStartSeconds, end);

      if (!loc.hasSermon) return await this.reject(video, `NO_SERMON: ${loc.reason}`, model);
      if (end - start < MIN_SERMON_SECONDS) {
        return await this.reject(video, `SERMON_TOO_SHORT (${Math.round((end - start) / 60)} min): ${loc.reason}`, model);
      }

      // Step 2: the sermon alone, for the summary and the Word of the Day.
      const digested = await this.ask<DigestAnswer>(
        [
          {
            type: 'video',
            uri: url,
            resolution: 'low',
            processing: { type: 'static', start_offset: `${start}s`, end_offset: `${end}s`, fps: VIDEO_FPS },
          },
          { type: 'text', text: digestPrompt(loc.preacher, video.title) },
        ],
        DIGEST_SCHEMA,
        digestAnswer.parse,
      );
      model = digested.model;
      const d = digested.answer;
      const dailyConfessions = await this.writeDailyConfessions(d).catch((err: unknown) => {
        this.logger.warn(`sermon-digest: daily confessions for ${video.id} not written yet (${(err as Error).message}) — next run`);
        return undefined;
      });

      await this.save(video, {
        status: 'READY',
        reason: loc.reason,
        model,
        sermonStartSeconds: start,
        sermonEndSeconds: end,
        sermonTitle: d.sermonTitle,
        preacher: d.preacher || loc.preacher,
        bibleReferences: d.bibleReferences,
        summary: d.summary,
        keyPoints: d.keyPoints,
        wordOfTheDay: d.wordOfTheDay,
        ...(dailyConfessions && { dailyConfessions }),
        attempts: (previous?.attempts ?? 0) + 1,
      });
      return { outcome: 'ready', detail: `${d.wordOfTheDay.word} — ${d.sermonTitle}` };
    } catch (err) {
      // Google busy or rate-limited: nothing wrong with the video, so nothing is
      // recorded against it — the next run simply tries again.
      if (err instanceof GeminiBusyError) return { outcome: 'busy', detail: err.message };
      const detail = err instanceof Error ? err.message : String(err);
      await this.save(video, { status: 'FAILED', reason: detail.slice(0, 1000), model, attempts: (previous?.attempts ?? 0) + 1 });
      return { outcome: 'failed', detail };
    }
  }

  /**
   * The newest sermon's daily confessions, written if they're missing — for a
   * sermon summarised before this existed, or whose step 3 met a busy Gemini.
   * Never fails the run.
   */
  private async ensureDailyConfessions(): Promise<void> {
    let videoId = 'the newest sermon';
    try {
      const row = await this.prisma.sermonDigest.findFirst({
        where: { tenantId: this.tenantId, status: 'READY' },
        orderBy: { publishedAt: 'desc' },
      });
      if (!row || row.dailyConfessions) return;
      videoId = row.videoId;
      const dailyConfessions = await this.writeDailyConfessions({
        sermonTitle: row.sermonTitle ?? row.videoTitle,
        summary: row.summary ?? '',
        keyPoints: (row.keyPoints as string[] | null) ?? [],
        bibleReferences: (row.bibleReferences as string[] | null) ?? [],
        wordOfTheDay: row.wordOfTheDay as unknown as WordOfTheDay,
      });
      await this.prisma.sermonDigest.update({ where: { id: row.id }, data: { dailyConfessions } });
      this.logger.log(`sermon-digest: ${dailyConfessions.length} daily confessions written for ${row.videoId}`);
    } catch (err) {
      this.logger.warn(`sermon-digest: daily confessions for ${videoId} not written yet (${(err as Error).message}) — next run`);
    }
  }

  /** Step 3: text only, from what step 2 drew out of the sermon. */
  private async writeDailyConfessions(
    d: Pick<DigestAnswer, 'sermonTitle' | 'summary' | 'keyPoints' | 'bibleReferences' | 'wordOfTheDay'>,
  ): Promise<string[][]> {
    const { text } = await this.gemini.generate({
      input: dailyConfessionsPrompt(d),
      schema: DAILY_CONFESSIONS_SCHEMA,
      models: VIDEO_MODELS,
      maxOutputTokens: 8192,
      waitBudgetMs: 30_000,
    });
    return dailyConfessionsAnswer.parse(parseGeminiJson(text)).confessions;
  }

  private async ask<T>(input: GeminiContent[], schema: Record<string, unknown>, validate: (v: unknown) => T, thinkingLevel?: 'low') {
    const { text, model } = await this.gemini.generate({
      input,
      schema,
      maxOutputTokens: 16_384,
      thinkingLevel,
      models: VIDEO_MODELS,
      timeoutMs: 180_000,
      waitBudgetMs: 45_000,
    });
    return { answer: validate(parseGeminiJson(text)), model };
  }

  private async reject(video: ServiceVideo, reason: string, model?: string): Promise<{ outcome: Outcome; detail: string }> {
    await this.save(video, { status: 'REJECTED', reason, model, attempts: 1 });
    return { outcome: 'rejected', detail: reason };
  }

  private async save(video: ServiceVideo, data: Partial<Omit<SermonDigest, 'bibleReferences' | 'keyPoints' | 'wordOfTheDay' | 'dailyConfessions'>> & {
    status: string;
    bibleReferences?: string[];
    keyPoints?: string[];
    wordOfTheDay?: WordOfTheDay;
    dailyConfessions?: string[][];
  }) {
    const fields = {
      videoTitle: video.title,
      publishedAt: video.startedAt,
      serviceDay: video.serviceDay,
      ...data,
    };
    await this.prisma.sermonDigest.upsert({
      where: { tenantId_videoId: { tenantId: this.tenantId, videoId: video.id } },
      create: { tenantId: this.tenantId, videoId: video.id, ...fields },
      update: fields,
    });
  }

  private skip(reason: string): SermonDigestRunResult {
    this.logger.log(`sermon-digest: skipped (${reason})`);
    return { processed: [], skipped: reason };
  }
}

/** The calendar date in Lagos, as a number of days, so "a day" turns at Lagos midnight. */
function lagosDayNumber(date: Date): number {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(date);
  return Math.floor(Date.parse(`${ymd}T00:00:00Z`) / 86_400_000);
}

/**
 * Which confession shows today. The service day gets the sermon's own
 * confession; each day after gets the next of the daily ones, going round
 * again if the next service is late. `day` is 0 on the service day.
 */
export function confessionForDay(
  original: string[],
  daily: string[][] | null,
  serviceDate: Date,
  now: Date,
): { lines: string[]; day: number } {
  const pool = [original, ...(daily ?? [])].filter((lines) => lines.length > 0);
  const day = Math.max(0, lagosDayNumber(now) - lagosDayNumber(serviceDate));
  if (pool.length === 0) return { lines: [], day };
  return { lines: pool[day % pool.length], day };
}

function toView(row: SermonDigest, now = new Date()): SermonDigestView {
  const start = row.sermonStartSeconds ?? 0;
  const word = row.wordOfTheDay as unknown as WordOfTheDay;
  const today = confessionForDay(word.confession, row.dailyConfessions as string[][] | null, row.publishedAt, now);
  return {
    videoId: row.videoId,
    videoTitle: row.videoTitle,
    serviceDay: row.serviceDay,
    serviceDate: row.publishedAt.toISOString(),
    sermonTitle: row.sermonTitle ?? row.videoTitle,
    preacher: row.preacher ?? '',
    bibleReferences: (row.bibleReferences as string[] | null) ?? [],
    summary: row.summary ?? '',
    keyPoints: (row.keyPoints as string[] | null) ?? [],
    // Everything reads today's confession from here, so the site changes daily.
    wordOfTheDay: { ...word, confession: today.lines },
    confessionDay: today.day + 1,
    watchUrl: `https://www.youtube.com/watch?v=${row.videoId}&t=${start}s`,
    sermonStartSeconds: start,
    sermonEndSeconds: row.sermonEndSeconds ?? 0,
    generatedAt: row.updatedAt.toISOString(),
  };
}
