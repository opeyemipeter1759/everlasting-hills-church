import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PushDispatchService } from '../push/services/push-dispatch.service';
import type { PushCategory, PushPayload } from '../push/push.types';
import { YouTubeServices } from '../sermon-digest/youtube-services';
import { ActiveFastService, type ActiveFast } from './active-fast.service';
import { fastDay, lagosDate, type FastDayInfo } from './fasting-day.util';

/** Sunday service time when the schedule doesn't say (church-info: "Sundays · 9:00 AM"). */
const DEFAULT_SERVICE_TIME = '9am';
const REMINDER_LEAD_MIN = 120;
/** The job runs every 5 minutes; a reminder up to this late is still worth sending. */
const REMINDER_GRACE_MIN = 30;
/** Start looking for the stream a little early: the team often goes live before time. */
const LIVE_FROM_MIN = -10;
/** No stream found by now: say the session has started anyway, linking to the channel. */
const LIVE_FALLBACK_MIN = 15;
/** Past this, a "we've started" notice is no use to anyone. */
const LIVE_UNTIL_MIN = 90;
const MIN = 60_000;
const STREAMS_URL = 'https://www.youtube.com/@everlastinghillschurch/streams';

export interface FastSession {
  key: 'morning' | 'service' | 'evening';
  /** "Morning prayer" */
  name: string;
  /** "6am" */
  time: string;
  startsAt: Date;
}

/** "6am", "8 pm", "5:30pm", "9:00 AM" → minutes after midnight; null if unreadable. */
export function parseClock(value: string): number | null {
  const m = /^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*$/i.exec(value);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2] ?? 0);
  if (hour < 1 || hour > 12 || minute > 59) return null;
  return ((hour % 12) + (m[3].toLowerCase() === 'pm' ? 12 : 0)) * 60 + minute;
}

/** A Lagos wall-clock time on a date, as an instant (Lagos is UTC+1 all year). */
function lagosInstant(date: string, minutes: number): Date {
  return new Date(Date.parse(`${date}T00:00:00Z`) + (minutes - 60) * MIN);
}

/** The day's sessions in order: morning prayer or Sunday service, then evening prayer. */
export function fastSessions(fast: ActiveFast, info: FastDayInfo): FastSession[] {
  const rules = fast.rules as ActiveFast['rules'] & { serviceTime?: string };
  const out: FastSession[] = [];
  const add = (key: FastSession['key'], name: string, time: string | undefined) => {
    const minutes = time ? parseClock(time) : null;
    if (time && minutes !== null) out.push({ key, name, time, startsAt: lagosInstant(info.date, minutes) });
  };
  if (rules.serviceDays.includes(info.weekday)) add('service', 'Sunday service', rules.serviceTime ?? DEFAULT_SERVICE_TIME);
  else if (info.morning) add('morning', 'Morning prayer', rules.morningTime);
  if (info.evening) add('evening', 'Evening prayer', rules.eveningTime);
  return out;
}
@Injectable()
export class FastingPushService {
  private readonly logger = new Logger(FastingPushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatch: PushDispatchService,
    private readonly youtube: YouTubeServices,
    private readonly fasts: ActiveFastService,
  ) {}

  async run(now = new Date()): Promise<string[]> {
    const today = lagosDate(now);
    const fast = await this.fasts.on(today);
    const info = fast && fastDay(fast.rules, today);
    if (!fast || !info) return [];

    const sent: string[] = [];
    const sessions = fastSessions(fast, info);
    for (const [index, s] of sessions.entries()) {
      const fromStart = (now.getTime() - s.startsAt.getTime()) / MIN;
      const base = `fast:${fast.eventSlug}:${today}:${s.key}`;
      const dayLine = `Day ${info.dayNumber} of ${info.totalDays}`;

      if (fromStart >= -REMINDER_LEAD_MIN && fromStart < -REMINDER_LEAD_MIN + REMINDER_GRACE_MIN) {
        const ok = await this.once(`${base}:2h`, 'serviceReminder', {
          title: `${fast.eventTitle} · ${s.name} in 2 hours`,
          body: `Starts at ${s.time}. ${dayLine}. Join us live on YouTube.`,
          url: `/events/${fast.eventSlug}`,
          tag: `${base}:2h`,
        });
        if (ok) sent.push(`${s.key}:2h`);
      }

      if (fromStart >= LIVE_FROM_MIN && fromStart < LIVE_UNTIL_MIN && !(await this.claimed(`${base}:live`))) {
        const stream = await this.liveStream();
        if (!stream && fromStart < LIVE_FALLBACK_MIN) continue;
        const url = stream ? `https://www.youtube.com/watch?v=${stream.id}` : fast.liveUrl ?? STREAMS_URL;
        const opening = info.isFirst && index === 0;
        const ok = await this.once(`${base}:live`, 'serviceStarting', {
          title: opening
            ? `🔥 ${fast.eventTitle} has started`
            : stream
              ? `🔥 ${fast.eventTitle} is live: ${s.name}`
              : `${fast.eventTitle} · ${s.name} has started`,
          body: `${dayLine}. ${stream ? 'We are live now. Tap to join on YouTube.' : 'Tap to join us on YouTube.'}`,
          url,
          tag: `${base}:live`,
          actions: [{ action: 'join', title: 'Join live', url }],
        });
        if (ok) sent.push(`${s.key}:live`);
      }
    }
    if (sent.length) this.logger.log(`fasting-push: ${today} sent ${sent.join(', ')}`);
    return sent;
  }

  private async liveStream() {
    if (!this.youtube.configured) return null;
    try {
      return await this.youtube.liveNow();
    } catch (err) {
      this.logger.warn(`fasting-push: couldn't check YouTube (${(err as Error).message})`);
      return null;
    }
  }

  private async claimed(key: string): Promise<boolean> {
    return (await this.prisma.pushNoticeLog.count({ where: { tenantId: this.fasts.tenant, key } })) > 0;
  }

  /** Claims the key, then sends. False when another run already claimed it. */
  private async once(key: string, category: PushCategory, payload: PushPayload): Promise<boolean> {
    try {
      await this.prisma.pushNoticeLog.create({ data: { id: randomUUID(), tenantId: this.fasts.tenant, key } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return false;
      throw err;
    }
    const result = await this.dispatch.dispatch(category, { tenantId: this.fasts.tenant }, payload);
    this.logger.log(`fasting-push: ${key} → delivered ${result.delivered} of ${result.attempted}`);
    return true;
  }
}
