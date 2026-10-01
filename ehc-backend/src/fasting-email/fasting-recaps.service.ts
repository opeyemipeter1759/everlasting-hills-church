import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiBusyError, GeminiClient, GeminiError, parseGeminiJson } from '../ai/gemini-client';
import { YouTubeServices, type StreamVideo } from '../sermon-digest/youtube-services';
import { ActiveFastService } from './active-fast.service';
import { addDays, lagosDate } from './fasting-day.util';

const VIDEO_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash'];
/** A frame every five seconds is plenty to follow a prayer meeting. */
const VIDEO_FPS = 0.2;
const MAX_ATTEMPTS = 3;
/** Leave room under Cloud Scheduler's deadline; the rest waits for the next run. */
const RUN_BUDGET_MS = 240_000;

const RECAP_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'A short title for the session, 3-8 words' },
    summary: { type: 'string', description: '3-4 warm sentences: what was taught and prayed about' },
    keyPoints: { type: 'array', items: { type: 'string' }, description: '2-4 short takeaways' },
  },
  required: ['title', 'summary', 'keyPoints'],
};

const recapAnswer = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(2000),
  keyPoints: z.array(z.string().min(1).max(400)).max(6),
});

function recapPrompt(title: string): string {
  return [
    `This is a recording of "${title}", a session from Everlasting Hills Church's 30 days of fasting and prayer, streamed on YouTube.`,
    'Write a short recap for church members who missed it, to read the next morning.',
    'Cover what was taught (the main scripture and message) and what the church prayed about.',
    'Skip announcements, technical breaks and long stretches of music. Do not invent anything that was not said.',
    'Keep it warm and plain; British English.',
  ].join(' ');
}

/**
 * Writes a recap of each session streamed during a fast, once YouTube has
 * processed the recording (Gemini can't read it before — it answers 403), so
 * the 5am email only has to read them. Runs every few hours overnight.
 */
@Injectable()
export class FastingRecapsService {
  private readonly logger = new Logger(FastingRecapsService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiClient,
    private readonly youtube: YouTubeServices,
    private readonly fasts: ActiveFastService,
  ) {}

  async run(): Promise<{ written: number }> {
    if (this.running) return { written: 0 };
    const today = lagosDate();
    // Yesterday's sessions feed this morning's email, so a fast is "on" for recaps one day past its end.
    const fast = (await this.fasts.on(today)) ?? (await this.fasts.on(addDays(today, -1)));
    if (!fast || !this.gemini.enabled || !this.youtube.configured) {
      this.logger.log('fasting-recaps: no fast running (or Gemini/YouTube not set up) — nothing to do');
      return { written: 0 };
    }

    this.running = true;
    const started = Date.now();
    let written = 0;
    try {
      const from = addDays(fast.rules.startDate, -1);
      const streams = (await this.youtube.recentStreams()).filter((s) => {
        const day = lagosDate(s.startedAt);
        return day >= from && day <= today;
      });
      const done = await this.prisma.fastingRecap.findMany({
        where: { tenantId: this.fasts.tenant, videoId: { in: streams.map((s) => s.id) } },
        select: { videoId: true, status: true, attempts: true },
      });
      const byId = new Map(done.map((d) => [d.videoId, d]));

      // Oldest first, so yesterday's sessions are ready before today's.
      for (const stream of [...streams].reverse()) {
        const row = byId.get(stream.id);
        if (row?.status === 'READY' || (row && row.attempts >= MAX_ATTEMPTS)) continue;
        if (!stream.readable) {
          this.logger.log(`fasting-recaps: "${stream.title}" not processed by YouTube yet — next run`);
          continue;
        }
        if (Date.now() - started > RUN_BUDGET_MS) break;
        if (await this.recap(stream, row?.attempts ?? 0)) written++;
      }
      return { written };
    } finally {
      this.running = false;
    }
  }

  private async recap(stream: StreamVideo, attempts: number): Promise<boolean> {
    const base = { tenantId: this.fasts.tenant, videoId: stream.id, videoTitle: stream.title, startedAt: stream.startedAt };
    try {
      const { text, model } = await this.gemini.generate({
        input: [
          { type: 'video', uri: `https://www.youtube.com/watch?v=${stream.id}`, resolution: 'low', processing: { type: 'static', fps: VIDEO_FPS } },
          { type: 'text', text: recapPrompt(stream.title) },
        ],
        schema: RECAP_SCHEMA,
        models: VIDEO_MODELS,
        maxOutputTokens: 8192,
        thinkingLevel: 'low',
        timeoutMs: 180_000,
        waitBudgetMs: 30_000,
      });
      const answer = recapAnswer.parse(parseGeminiJson(text));
      await this.save(base, { status: 'READY', title: answer.title, summary: answer.summary, keyPoints: answer.keyPoints, reason: model, attempts: attempts + 1 });
      this.logger.log(`fasting-recaps: ${stream.id} "${stream.title}" → recap written`);
      return true;
    } catch (err) {
      // Busy, or not readable yet: nothing wrong with the video, so no attempt is spent.
      if (err instanceof GeminiBusyError || (err instanceof GeminiError && err.status === 403)) {
        this.logger.log(`fasting-recaps: ${stream.id} not readable yet (${(err as Error).message}) — next run`);
        return false;
      }
      const reason = (err instanceof Error ? err.message : String(err)).slice(0, 1000);
      await this.save(base, { status: 'FAILED', reason, attempts: attempts + 1 });
      this.logger.warn(`fasting-recaps: ${stream.id} failed (${reason})`);
      return false;
    }
  }

  private async save(
    base: { tenantId: string; videoId: string; videoTitle: string; startedAt: Date },
    data: { status: string; title?: string; summary?: string; keyPoints?: string[]; reason?: string; attempts: number },
  ) {
    await this.prisma.fastingRecap.upsert({
      where: { tenantId_videoId: { tenantId: base.tenantId, videoId: base.videoId } },
      create: { id: randomUUID(), ...base, ...data },
      update: { ...data, videoTitle: base.videoTitle, updatedAt: new Date() },
    });
  }
}
