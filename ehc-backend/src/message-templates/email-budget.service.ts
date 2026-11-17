import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Resend sends at most 100 emails a day. Template emails may use 70 of them,
 * so 30 always stay for the mail the system itself must send (password resets,
 * sign-in alerts, the registration emails).
 */
export const TEMPLATE_EMAIL_DAILY_LIMIT = 70;

/** Lagos is UTC+1 all year (no daylight saving), so a church day is a fixed offset from UTC. */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Today in Lagos as a half-open UTC range [start, end). */
export function lagosDayRange(now: Date): { start: Date; end: Date } {
  const local = new Date(now.getTime() + LAGOS_OFFSET_MS);
  const start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - LAGOS_OFFSET_MS;
  return { start: new Date(start), end: new Date(start + DAY_MS) };
}

/** The Lagos calendar date, "YYYY-MM-DD". */
export function lagosDate(now: Date): string {
  return new Date(now.getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
}

export interface EmailClaim {
  tenantId: string;
  visitorId: string;
  templateKey: string;
  templateVersion: number;
  sentById: string | null;
}

/**
 * The daily cap guard every template email goes through. Today's use is counted
 * from MessageLog (emails sent or still being sent, Lagos day), so the count
 * survives restarts and is the same on every Cloud Run instance. A claim holds
 * a per-church advisory lock while it counts and writes, so two sends at once
 * can never both take the last email of the day.
 */
@Injectable()
export class DailyEmailBudget {
  readonly limit = TEMPLATE_EMAIL_DAILY_LIMIT;

  constructor(private readonly prisma: PrismaService) {}

  async usedToday(tenantId: string, now = new Date()): Promise<number> {
    const { start, end } = lagosDayRange(now);
    return this.prisma.messageLog.count({
      where: { tenantId, channel: 'email', status: { in: ['SENT', 'PENDING'] }, sentAt: { gte: start, lt: end } },
    });
  }

  async remaining(tenantId: string, now = new Date()): Promise<number> {
    return Math.max(0, this.limit - (await this.usedToday(tenantId, now)));
  }

  /**
   * Takes one of today's emails: writes a PENDING log row and returns its id.
   * When the day's allowance is used up, writes a SKIPPED row instead and
   * returns null, so the record shows who did not get it and why.
   */
  async claim(c: EmailClaim, now = new Date()): Promise<string | null> {
    const { start, end } = lagosDayRange(now);
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`email-budget:${c.tenantId}`}))`;
      const used = await tx.messageLog.count({
        where: { tenantId: c.tenantId, channel: 'email', status: { in: ['SENT', 'PENDING'] }, sentAt: { gte: start, lt: end } },
      });
      const allowed = used < this.limit;
      const row = await tx.messageLog.create({
        data: {
          id: randomUUID(),
          tenantId: c.tenantId,
          visitorId: c.visitorId,
          channel: 'email',
          templateKey: c.templateKey,
          templateVersion: c.templateVersion,
          sentById: c.sentById,
          status: allowed ? 'PENDING' : 'SKIPPED',
          error: allowed ? null : "Today's email allowance was used up",
          sentAt: now,
        },
      });
      return allowed ? row.id : null;
    });
  }
}
