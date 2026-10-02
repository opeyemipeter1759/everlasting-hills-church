import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { buildDailyFastEmail, type DailyFastDay, type SessionRecap } from '../notifications/templates/daily-fast.email';
import { YouTubeServices } from '../sermon-digest/youtube-services';
import { ActiveFastService, type ActiveFast } from './active-fast.service';
import { EmailUnsubscribeService } from './email-unsubscribe.service';
import { addDays, fastDay, lagosDate } from './fasting-day.util';

/** Resend allows a couple of requests a second; stay under it. */
const SEND_GAP_MS = 600;
const RATE_LIMIT_RETRIES = 3;
/** Stop before Cloud Scheduler's deadline; a second trigger finishes the rest (sends are logged, never repeated). */
const RUN_BUDGET_MS = 240_000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface DailyFastRunResult {
  day: string | null;
  sent: number;
  failed: number;
  skipped: number;
  remaining: number;
}

/**
 * The 5am email during a church fast, to everyone on the church's list —
 * members and visitors alike — except anyone who has unsubscribed. Sends one
 * at a time under Resend's rate limit, logs each address per day so a re-run
 * never sends twice, and picks up where an earlier run stopped.
 */
@Injectable()
export class DailyFastEmailService {
  private readonly logger = new Logger(DailyFastEmailService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly youtube: YouTubeServices,
    private readonly fasts: ActiveFastService,
    private readonly unsubscribes: EmailUnsubscribeService,
  ) {}

  async run(): Promise<DailyFastRunResult> {
    const today = lagosDate();
    const empty = { day: null, sent: 0, failed: 0, skipped: 0, remaining: 0 };
    if (this.running) return empty;
    const fast = await this.fasts.on(today);
    if (!fast) {
      this.logger.log(`daily-fast-email: no fast on ${today} — nothing to send`);
      return empty;
    }

    this.running = true;
    const started = Date.now();
    try {
      const campaign = `fast:${fast.eventSlug}`;
      const content = await this.content(fast, today);
      if (!content) return empty;
      const [recipients, unsubscribed, alreadySent] = await Promise.all([
        this.recipients(),
        this.unsubscribes.unsubscribed(),
        this.prisma.dailyEmailLog.findMany({
          where: { tenantId: this.fasts.tenant, campaign, day: today, status: 'SENT' },
          select: { email: true },
        }),
      ]);
      const sentSet = new Set(alreadySent.map((r) => r.email));
      const queue = recipients.filter((r) => !unsubscribed.has(r.email) && !sentSet.has(r.email));
      const result: DailyFastRunResult = { day: today, sent: 0, failed: 0, skipped: recipients.length - queue.length, remaining: 0 };

      for (let i = 0; i < queue.length; i++) {
        if (Date.now() - started > RUN_BUDGET_MS) {
          result.remaining = queue.length - i;
          this.logger.warn(`daily-fast-email: out of time with ${result.remaining} left — the next trigger finishes them`);
          break;
        }
        const r = queue[i];
        const error = await this.sendOne(fast, content, r);
        await this.prisma.dailyEmailLog.upsert({
          where: { tenantId_campaign_day_email: { tenantId: this.fasts.tenant, campaign, day: today, email: r.email } },
          create: { id: randomUUID(), tenantId: this.fasts.tenant, campaign, day: today, email: r.email, status: error ? 'FAILED' : 'SENT', error },
          update: { status: error ? 'FAILED' : 'SENT', error },
        });
        if (error) result.failed++;
        else result.sent++;
        await sleep(SEND_GAP_MS);
      }
      this.logger.log(
        `daily-fast-email: ${today} Day ${content.day.dayNumber} → sent ${result.sent}, failed ${result.failed}, skipped ${result.skipped}, left ${result.remaining}`,
      );
      return result;
    } finally {
      this.running = false;
    }
  }

  /** One email to one address, as it would go out on `date` — for checking before the real thing. */
  async sendTest(email: string, date = lagosDate()): Promise<string | null> {
    const fast = await this.fasts.on(date);
    if (!fast) return `No fast on ${date}`;
    const content = await this.content(fast, date);
    if (!content) return `No fast day on ${date}`;
    return this.sendOne(fast, content, { email: email.trim().toLowerCase(), firstName: null });
  }

  private async sendOne(
    fast: ActiveFast,
    content: { day: DailyFastDay; yesterday: SessionRecap[]; eventUrl: string },
    r: { email: string; firstName: string | null },
  ): Promise<string | null> {
    const payload = buildDailyFastEmail({
      to: r.email,
      firstName: r.firstName,
      day: content.day,
      yesterday: content.yesterday,
      imageUrl: fast.imageUrl,
      unsubscribe: this.unsubscribes.links(r.email),
      eventUrl: content.eventUrl,
    });
    for (let attempt = 0; ; attempt++) {
      try {
        await this.notifications.deliver(payload);
        return null;
      } catch (err) {
        const message = (err as Error).message;
        if (/rate.?limit|429|too many/i.test(message) && attempt < RATE_LIMIT_RETRIES) {
          await sleep(1500 * (attempt + 1));
          continue;
        }
        this.logger.warn(`daily-fast-email: ${r.email} failed — ${message}`);
        return message.slice(0, 500);
      }
    }
  }

  /** What every email that day says: the day itself and yesterday's sessions. */
  private async content(fast: ActiveFast, date: string) {
    const info = fastDay(fast.rules, date);
    if (!info) return null;
    const dateLabel = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    const day: DailyFastDay = {
      fastName: fast.eventTitle,
      theme: fast.theme,
      dateLabel,
      dayNumber: info.dayNumber,
      totalDays: info.totalDays,
      kind: info.kind,
      mealTime: info.mealTime,
      dryDay: info.dryDay,
      dryLength: info.dryLength,
      breakTime: info.breakTime,
      lastMealBefore: info.lastMealBefore,
      isFirst: info.isFirst,
      isLast: info.isLast,
      morning: info.morning,
      evening: info.evening,
      liveUrl: fast.liveUrl ?? 'https://www.youtube.com/@everlastinghillschurch/streams',
    };
    return { day, yesterday: await this.yesterday(date), eventUrl: `${this.unsubscribes.siteUrl}/events/${fast.eventSlug}` };
  }

  /** Yesterday's streamed sessions, with a recap where one has been written. Never fails the email. */
  private async yesterday(date: string): Promise<SessionRecap[]> {
    try {
      if (!this.youtube.configured) return [];
      const day = addDays(date, -1);
      const streams = (await this.youtube.recentStreams())
        .filter((s) => lagosDate(s.startedAt) === day)
        .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
      if (streams.length === 0) return [];
      const recaps = await this.prisma.fastingRecap.findMany({
        where: { tenantId: this.fasts.tenant, videoId: { in: streams.map((s) => s.id) }, status: 'READY' },
      });
      const byId = new Map(recaps.map((r) => [r.videoId, r]));
      return streams.map((s) => {
        const r = byId.get(s.id);
        return {
          title: s.title,
          url: `https://www.youtube.com/watch?v=${s.id}`,
          recap: r?.summary ? { title: r.title ?? s.title, summary: r.summary, keyPoints: (r.keyPoints as string[] | null) ?? [] } : null,
        };
      });
    } catch (err) {
      this.logger.warn(`daily-fast-email: couldn't read yesterday's streams (${(err as Error).message}) — sending without recaps`);
      return [];
    }
  }

  /** Everyone on the church's list with an email address — members and visitors — once each. */
  private async recipients(): Promise<{ email: string; firstName: string | null }[]> {
    const [members, visitors] = await Promise.all([
      this.prisma.member.findMany({ where: { tenantId: this.fasts.tenant, email: { not: null } }, select: { email: true, firstName: true } }),
      this.prisma.visitor.findMany({ where: { tenantId: this.fasts.tenant, email: { not: null } }, select: { email: true, firstName: true } }),
    ]);
    const byEmail = new Map<string, { email: string; firstName: string | null }>();
    for (const p of [...members, ...visitors]) {
      const email = p.email?.trim().toLowerCase();
      if (!email || !EMAIL.test(email) || byEmail.has(email)) continue;
      byEmail.set(email, { email, firstName: p.firstName ?? null });
    }
    return [...byEmail.values()];
  }
}
