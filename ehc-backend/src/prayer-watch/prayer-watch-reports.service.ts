import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { Prisma, Role, type PrayerWatchReport } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { hasAnyRole } from '../auth/policy/staff';
import { NotificationEvents } from '../notifications/notification-events';
import { PushDispatchService } from '../push/services/push-dispatch.service';
import { buildPrayerWatchReportReminderEmail } from '../notifications/templates/prayer-watch-report-reminder.email';
import { SubmitPrayerWatchReportDto } from './dto/prayer-watch-report.dto';
import { slotDateTime } from './prayer-watch.util';
import { isWatchNight, lagosNightOf, latestNightStarted, nightDateValue, nightKey, recentWatchNights, watchMinutes } from './prayer-watch-nights';

/** Same tier as the admin Prayer Watch routes: may file a report for any watch. */
const ADMIN_ROLES: readonly Role[] = [Role.ADMIN_HEAD, Role.ADMIN, Role.PASTOR, Role.SUPER_ADMIN];
const DAY_MS = 86_400_000;
const WAT_OFFSET_MS = 3_600_000;
/** Nights a leader sees on their report page, and how many days back they can still file one. */
const HISTORY_NIGHTS = 7;
const EDITABLE_DAYS = 14;
/** The nudge goes out once, from 15 minutes after a watch ends, if nothing has come in. */
const NUDGE_AFTER_MS = 15 * 60_000;
const NUDGE_UNTIL_MS = 4 * 60 * 60_000;

type Slot = Prisma.PrayerSlotGetPayload<{ include: { Leader: { select: { profileId: true; fullName: true; email: true } } } }>;

const lagosClock = (instant: Date) => new Date(instant.getTime() + WAT_OFFSET_MS).toISOString().slice(11, 16);
const nightName = (night: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' }).format(nightDateValue(night));

/** Watch leaders' nightly reports: the watch was kept, for how long, by how many, and handed on. */
@Injectable()
export class PrayerWatchReportsService {
  private readonly logger = new Logger(PrayerWatchReportsService.name);
  private readonly tenantId: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly pushDispatch: PushDispatchService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl = (config.get('FRONTEND_URL', { infer: true }) ?? 'https://www.everlastinghills.church').replace(/\/$/, '');
  }

  private async currentSlots(): Promise<Slot[]> {
    const watch = await this.prisma.prayerWatch.findFirst({
      where: { tenantId: this.tenantId },
      orderBy: { watchDate: 'desc' },
      include: { Slots: { orderBy: { position: 'asc' }, include: { Leader: { select: { profileId: true, fullName: true, email: true } } } } },
    });
    return watch?.Slots ?? [];
  }

  /** Leads it by account, or by the email on the sign-up when it was made signed out. */
  private leads(slot: Slot, user: Pick<AuthUser, 'profileId' | 'email'>): boolean {
    const leader = slot.Leader;
    if (!leader) return false;
    if (user.profileId && leader.profileId === user.profileId) return true;
    return Boolean(user.email) && leader.email.trim().toLowerCase() === user.email.trim().toLowerCase();
  }

  private nextAfter(slots: Slot[], slot: Slot) {
    const next = slots[slots.findIndex((s) => s.id === slot.id) + 1];
    return next ? { label: next.label, leaderName: next.Leader?.fullName ?? null } : null;
  }

  private toView(r: PrayerWatchReport) {
    return {
      night: nightKey(r.nightDate),
      startTime: lagosClock(r.startedAt),
      endTime: lagosClock(r.endedAt),
      minutes: r.minutesPrayed,
      peoplePresent: r.peoplePresent,
      handedOver: r.handedOver,
      handedOverTo: r.handedOverTo,
      notes: r.notes,
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  /** The watches this person leads, the watch after each, and the last week of nights with what was reported. */
  async mine(user: Pick<AuthUser, 'profileId' | 'email'>, now = new Date()) {
    const slots = await this.currentSlots();
    const led = slots.filter((s) => this.leads(s, user));
    if (led.length === 0) return { slots: [] };

    const nightsFor = new Map(led.map((s) => [s.id, recentWatchNights(latestNightStarted(now, s.startTime), HISTORY_NIGHTS)]));
    const oldest = [...nightsFor.values()].map((n) => n[n.length - 1]).sort()[0];
    const reports = await this.prisma.prayerWatchReport.findMany({
      where: { slotId: { in: led.map((s) => s.id) }, nightDate: { gte: nightDateValue(oldest) } },
    });
    const byKey = new Map(reports.map((r) => [`${r.slotId}|${nightKey(r.nightDate)}`, r]));

    return {
      slots: led.map((slot) => ({
        id: slot.id,
        label: slot.label,
        startTime: slot.startTime,
        endTime: slot.endTime,
        position: slots.indexOf(slot),
        next: this.nextAfter(slots, slot),
        nights: nightsFor.get(slot.id)!.map((night) => {
          const report = byKey.get(`${slot.id}|${night}`);
          return { night, report: report ? this.toView(report) : null };
        }),
      })),
    };
  }

  /** Files the report for one watch on one night, or corrects the one already filed. */
  async submit(user: AuthUser, dto: SubmitPrayerWatchReportDto, now = new Date()) {
    const slots = await this.currentSlots();
    const slot = slots.find((s) => s.id === dto.slotId);
    if (!slot) throw new NotFoundException('That watch was not found');
    const isAdmin = hasAnyRole(user, ADMIN_ROLES);
    if (!isAdmin && !this.leads(slot, user)) throw new ForbiddenException('Only the leader of this watch can report it');

    const night = dto.nightDate;
    const nightDate = nightDateValue(night);
    if (Number.isNaN(nightDate.getTime()) || nightKey(nightDate) !== night) throw new BadRequestException('That night is not a real date');
    if (slotDateTime(nightDate, slot.startTime) > now) throw new BadRequestException("This watch hasn't started yet. Report it once it has.");
    const daysBack = (nightDateValue(lagosNightOf(now)).getTime() - nightDate.getTime()) / DAY_MS;
    if (!isAdmin && daysBack > EDITABLE_DAYS) throw new BadRequestException('That night is too far back to report now. Ask a church admin to add it.');
    const minutes = watchMinutes(night, dto.startTime, dto.endTime);
    if (minutes === null) throw new BadRequestException('The finish time needs to be after the start time, on the same night.');

    const data = {
      reportedById: user.profileId ?? user.userId,
      startedAt: slotDateTime(nightDate, dto.startTime),
      endedAt: slotDateTime(nightDate, dto.endTime),
      minutesPrayed: minutes,
      peoplePresent: dto.peoplePresent,
      handedOver: dto.handedOver,
      handedOverTo: dto.handedOver ? dto.handedOverTo?.trim() || this.nextAfter(slots, slot)?.leaderName || null : null,
      notes: dto.notes?.trim() || null,
    };
    const report = await this.prisma.prayerWatchReport.upsert({
      where: { slotId_nightDate: { slotId: slot.id, nightDate } },
      create: { id: randomUUID(), tenantId: this.tenantId, slotId: slot.id, nightDate, ...data },
      update: data,
    });
    return this.toView(report);
  }

  @Cron('*/15 * * * *', { name: 'prayer-watch-report-reminders' })
  async scheduledReminders(): Promise<void> {
    try {
      await this.sendReminders();
    } catch (err) {
      this.logger.error(`prayer-watch-report-reminders failed: ${(err as Error).message}`);
    }
  }

  /** Nudges each leader, once, whose watch ended a little while ago with no report in. */
  async sendReminders(now = new Date()): Promise<{ nudged: number }> {
    const slots = await this.currentSlots();
    let nudged = 0;
    for (const slot of slots) {
      const leader = slot.Leader;
      if (!leader) continue;
      const night = latestNightStarted(now, slot.startTime);
      const sinceEnd = now.getTime() - slotDateTime(nightDateValue(night), slot.endTime).getTime();
      if (!isWatchNight(night) || sinceEnd < NUDGE_AFTER_MS || sinceEnd > NUDGE_UNTIL_MS) continue;
      if (await this.prisma.prayerWatchReport.count({ where: { slotId: slot.id, nightDate: nightDateValue(night) } })) continue;
      if (!(await this.claim(`prayer-watch-report:${slot.id}:${night}`))) continue;

      const next = this.nextAfter(slots, slot);
      const url = `${this.appUrl}/dashboard/prayer-watch/report`;
      this.events.emit(
        NotificationEvents.SendEmail,
        buildPrayerWatchReportReminderEmail({ to: leader.email, fullName: leader.fullName, slotLabel: slot.label, nightName: nightName(night), next, url }),
      );
      if (leader.profileId) {
        await this.pushDispatch
          .dispatch(
            'prayerWatchReminder',
            { userIds: [leader.profileId], tenantId: this.tenantId },
            {
              title: `How did the ${slot.label} go?`,
              body: next ? `Add ${nightName(night)} night's report and confirm you handed over to the ${next.label}.` : `Add ${nightName(night)} night's report and close the night.`,
              url: '/dashboard/prayer-watch/report',
              tag: `prayer-watch-report-${slot.id}`,
            },
          )
          .catch((err: Error) => this.logger.warn(`Report reminder push failed: ${err.message}`));
      }
      nudged += 1;
    }
    return { nudged };
  }

  /** Records that a nudge went out; false when one already had, so it never goes twice. */
  private async claim(key: string): Promise<boolean> {
    try {
      await this.prisma.pushNoticeLog.create({ data: { id: randomUUID(), tenantId: this.tenantId, key } });
      return true;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return false;
      throw err;
    }
  }
}
