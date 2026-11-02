import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { PastoralBookingStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { OneOnOneNotifyService } from './one-on-one-notify.service';
import { OneOnOneRequestsService, type BookingRow } from './one-on-one-requests.service';

const HOUR = 3_600_000;
/** A request still unanswered this close to its time lapses and frees the slot. */
const LAPSE_BEFORE_MS = 2 * HOUR;
/** The pastor is nudged once a request has waited this long, or is this close. */
const NUDGE_AFTER_MS = 24 * HOUR;
const NUDGE_WITHIN_MS = 48 * HOUR;

/**
 * Keeps One-on-One moving without anyone watching it. Runs every 10 minutes
 * (Cloud Scheduler job "one-on-one-sweep"). Every message is claimed with a
 * conditional update before it's sent, so overlapping runs never send twice.
 */
@Injectable()
export class OneOnOneSweepService {
  private readonly logger = new Logger(OneOnOneSweepService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly requests: OneOnOneRequestsService,
    private readonly notify: OneOnOneNotifyService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  @Cron('*/10 * * * *', { name: 'one-on-one-sweep' })
  async scheduled(): Promise<void> {
    try {
      await this.run();
    } catch (err) {
      this.logger.error(`one-on-one-sweep failed: ${(err as Error).message}`);
    }
  }

  private find(where: Prisma.PastoralBookingWhereInput): Promise<BookingRow[]> {
    return this.prisma.pastoralBooking.findMany({ where: { tenantId: this.tenantId, ...where }, include: OneOnOneRequestsService.include, take: 200 });
  }

  /** True only for the run that flips the row; anyone else sees count 0. */
  private async claim(id: string, where: Prisma.PastoralBookingWhereInput, data: Prisma.PastoralBookingUpdateManyMutationInput): Promise<boolean> {
    const res = await this.prisma.pastoralBooking.updateMany({ where: { id, ...where }, data });
    return res.count === 1;
  }

  async run(now = new Date()): Promise<Record<string, number>> {
    const counts = { holdsReleased: 0, lapsed: 0, nudged: 0, dayReminders: 0, hourReminders: 0, completed: 0 };

    // Unconfirmed visitor holds: release quietly — they never confirmed, so there's no one to tell.
    const holds = await this.prisma.pastoralBooking.updateMany({
      where: { tenantId: this.tenantId, status: PastoralBookingStatus.HOLD, holdExpiresAt: { lte: now } },
      data: { status: PastoralBookingStatus.LAPSED },
    });
    counts.holdsReleased = holds.count;

    // Unanswered requests and unanswered suggestions, too close to their time.
    const lapseBy = new Date(now.getTime() + LAPSE_BEFORE_MS);
    for (const b of await this.find({
      OR: [
        { status: PastoralBookingStatus.PENDING, startsAt: { lte: lapseBy } },
        { status: PastoralBookingStatus.PROPOSED, proposedStartsAt: { lte: lapseBy } },
      ],
    })) {
      if (await this.claim(b.id, { status: b.status }, { status: PastoralBookingStatus.LAPSED })) {
        counts.lapsed++;
        await this.notify.toRequester(this.requests.toNotify(b), 'LAPSED');
      }
    }

    // A nudge to the pastor's side for requests that have waited a day, or are getting close.
    for (const b of await this.find({
      status: PastoralBookingStatus.PENDING,
      pendingNudgeSentAt: null,
      OR: [{ createdAt: { lte: new Date(now.getTime() - NUDGE_AFTER_MS) } }, { startsAt: { lte: new Date(now.getTime() + NUDGE_WITHIN_MS) } }],
    })) {
      // Fresh requests for a near time get a day's grace from the NEW notice before a nudge.
      if (now.getTime() - b.createdAt.getTime() < 6 * HOUR) continue;
      if (await this.claim(b.id, { pendingNudgeSentAt: null }, { pendingNudgeSentAt: now })) {
        counts.nudged++;
        await this.notify.toHostSide(this.requests.toNotify(b), 'NUDGE');
      }
    }

    // An hour before: requester only. Sending it also settles the day reminder, so a late approval never gets both at once.
    for (const b of await this.find({
      status: PastoralBookingStatus.APPROVED,
      reminderHourSentAt: null,
      startsAt: { gt: now, lte: new Date(now.getTime() + 75 * 60_000) },
    })) {
      if (await this.claim(b.id, { reminderHourSentAt: null }, { reminderHourSentAt: now, reminderDaySentAt: b.reminderDaySentAt ?? now })) {
        counts.hourReminders++;
        await this.notify.toRequester(this.requests.toNotify(b), 'REMINDER_HOUR');
      }
    }

    // The day before: both sides.
    for (const b of await this.find({
      status: PastoralBookingStatus.APPROVED,
      reminderDaySentAt: null,
      startsAt: { gt: new Date(now.getTime() + 2 * HOUR), lte: new Date(now.getTime() + 24 * HOUR) },
    })) {
      if (await this.claim(b.id, { reminderDaySentAt: null }, { reminderDaySentAt: now })) {
        counts.dayReminders++;
        await this.notify.toRequester(this.requests.toNotify(b), 'REMINDER_DAY');
        await this.notify.toHostSide(this.requests.toNotify(b), 'REMINDER_DAY');
      }
    }

    const done = await this.prisma.pastoralBooking.updateMany({
      where: { tenantId: this.tenantId, status: PastoralBookingStatus.APPROVED, endsAt: { lte: now } },
      data: { status: PastoralBookingStatus.COMPLETED },
    });
    counts.completed = done.count;

    if (Object.values(counts).some((n) => n > 0)) this.logger.log(`one-on-one-sweep: ${JSON.stringify(counts)}`);
    return counts;
  }
}
