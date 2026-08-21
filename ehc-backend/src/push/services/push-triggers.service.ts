import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { PushDispatchService } from './push-dispatch.service';
import { localMinutes } from './quiet-hours.util';
import { localCalendarDate, ruleOccursOn } from '../../calendar/services/recurrence.util';
import {
  PushEvents,
  type AnnouncementPublishedPayload,
  type ServiceLivePayload,
  type SermonPublishedPayload,
} from '../push.events';

/**
 * Everything that decides WHEN a push goes out.
 *
 * Two kinds of trigger:
 *   event-driven — an admin did something (opened a service, published a
 *                  sermon), fired via EventEmitter so the originating request
 *                  is never blocked or failed by a push problem
 *   scheduled    — time-based reminders, on the existing @nestjs/schedule cron
 *                  runtime already used by SchedulingService
 *
 * Scale note: @nestjs/schedule runs in-process, so these crons fire on every
 * instance. That is correct today because the API runs as a single Railway
 * instance, and SchedulingService already carries the same assumption. Before
 * scaling horizontally, these need a durable queue with a distributed lock
 * (BullMQ is already a dependency and REDIS_URL is already wired for it),
 * otherwise every member gets one notification per instance.
 */
@Injectable()
export class PushTriggersService {
  private readonly logger = new Logger(PushTriggersService.name);
  private readonly defaultTenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatch: PushDispatchService,
    config: ConfigService<Env, true>,
  ) {
    this.defaultTenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  // ── Event-driven ──────────────────────────────────────────────────────────

  /** A service opened for check-in. The one notification that means "now". */
  @OnEvent(PushEvents.ServiceLive, { async: true, promisify: true })
  async onServiceLive(payload: ServiceLivePayload) {
    await this.safely('service-live', () =>
      this.dispatch.dispatch(
        'serviceStarting',
        { tenantId: payload.tenantId },
        {
          title: `${payload.serviceName} has started`,
          body: 'Check in now to record your attendance.',
          url: `/dashboard/attendance?service=${payload.serviceId}`,
          tag: `service-live-${payload.serviceId}`,
        },
      ),
    );
  }

  /**
   * An announcement was published. Scope matters: a church-wide announcement
   * goes to everyone under the `announcements` category, while a department or
   * unit announcement goes only to that group under `unitAnnouncements`.
   * Sending a unit's notice to the whole church is how members learn to ignore
   * them.
   */
  @OnEvent(PushEvents.AnnouncementPublished, { async: true, promisify: true })
  async onAnnouncementPublished(payload: AnnouncementPublishedPayload) {
    await this.safely('announcement', async () => {
      const churchWide = !payload.audience || payload.audience === 'all';

      const userIds = churchWide
        ? undefined
        : await this.resolveGroupMembers(payload.tenantId, payload.audience);

      return this.dispatch.dispatch(
        churchWide ? 'announcements' : 'unitAnnouncements',
        { tenantId: payload.tenantId, userIds },
        {
          title: payload.title,
          body: truncate(payload.body, 140),
          url: '/dashboard',
          tag: `announcement-${payload.announcementId}`,
        },
      );
    });
  }

  @OnEvent(PushEvents.SermonPublished, { async: true, promisify: true })
  async onSermonPublished(payload: SermonPublishedPayload) {
    await this.safely('sermon', () =>
      this.dispatch.dispatch(
        'newSermon',
        { tenantId: payload.tenantId },
        {
          title: 'New sermon available',
          body: payload.preacher ? `${payload.title} by ${payload.preacher}` : payload.title,
          url: payload.slug ? `/dashboard/sermon/${payload.slug}` : '/dashboard/sermon',
          tag: `sermon-${payload.sermonId}`,
        },
      ),
    );
  }

  // ── Scheduled ─────────────────────────────────────────────────────────────

  /**
   * Day-before service reminder. Runs hourly and selects services falling in
   * the 24-25h window, so a service is caught exactly once regardless of what
   * time of day it sits at.
   */
  @Cron(CronExpression.EVERY_HOUR, { name: 'push-service-reminder' })
  async serviceReminders() {
    await this.safely('service-reminder', async () => {
      const now = new Date();
      const from = new Date(now.getTime() + 24 * 3_600_000);
      const to = new Date(now.getTime() + 25 * 3_600_000);

      const services = await this.prisma.service.findMany({
        where: {
          tenantId: this.defaultTenantId,
          scheduledAt: { gte: from, lt: to },
          cancelledAt: null,
        },
        select: { id: true, name: true, scheduledAt: true },
      });

      for (const service of services) {
        await this.dispatch.dispatch(
          'serviceReminder',
          { tenantId: this.defaultTenantId },
          {
            title: `${service.name} is tomorrow`,
            body: `Starts at ${formatLagosTime(service.scheduledAt)}.`,
            url: '/dashboard',
            tag: `service-reminder-${service.id}`,
          },
        );
      }
      return services.length;
    });
  }

  /**
   * Serving reminder, 48 hours ahead. Longer lead than the general reminder
   * because being rostered may require preparation or arranging cover.
   */
  @Cron(CronExpression.EVERY_HOUR, { name: 'push-serving-reminder' })
  async servingReminders() {
    await this.safely('serving-reminder', async () => {
      const now = new Date();
      const from = new Date(now.getTime() + 48 * 3_600_000);
      const to = new Date(now.getTime() + 49 * 3_600_000);

      const assignments = await this.prisma.serviceAssignment.findMany({
        where: {
          tenantId: this.defaultTenantId,
          Service: { scheduledAt: { gte: from, lt: to }, cancelledAt: null },
        },
        select: {
          role: true,
          Service: { select: { id: true, name: true, scheduledAt: true } },
          Member: { select: { profileId: true } },
        },
      });

      // Group by service so members serving at the same service share one send.
      const byService = new Map<
        string,
        { name: string; at: Date; userIds: string[]; roles: Set<string> }
      >();

      for (const a of assignments) {
        if (!a.Member?.profileId) continue;
        const entry = byService.get(a.Service.id) ?? {
          name: a.Service.name,
          at: a.Service.scheduledAt,
          userIds: [],
          roles: new Set<string>(),
        };
        entry.userIds.push(a.Member.profileId);
        entry.roles.add(a.role);
        byService.set(a.Service.id, entry);
      }

      for (const [serviceId, entry] of byService) {
        await this.dispatch.dispatch(
          'servingReminder',
          { tenantId: this.defaultTenantId, userIds: entry.userIds },
          {
            title: `You are serving at ${entry.name}`,
            body: `In two days, ${formatLagosDateTime(entry.at)}.`,
            url: '/dashboard',
            tag: `serving-${serviceId}`,
          },
        );
      }
      return byService.size;
    });
  }

  /**
   * Prayer meeting notification, at meeting time, opt-in only.
   *
   * Runs every 5 minutes and fires when the current Lagos wall time matches the
   * gathering's start time within that window. Checking wall time rather than
   * computing occurrences keeps this simple and correct across the DST-free
   * Lagos zone; it does mean a gathering must sit on a 5-minute boundary to
   * fire punctually, which every real meeting time does.
   */
  @Cron('*/5 * * * *', { name: 'push-prayer-meeting' })
  async prayerMeetingReminders() {
    await this.safely('prayer-meeting', async () => {
      const gatherings = await this.prisma.recurringGathering.findMany({
        where: { tenantId: this.defaultTenantId, isActive: true },
      });

      const now = new Date();
      let fired = 0;

      for (const gathering of gatherings) {
        const [h, m] = gathering.startTime.split(':').map(Number);
        const target = h * 60 + m;
        const current = localMinutes(now, gathering.timezone);

        // Within the 5-minute tick window that contains the start time.
        if (current < target || current >= target + 5) continue;

        // Respect the recurrence rule: a weekly gathering must not fire daily.
        if (!occursToday(gathering.recurrenceRule, gathering.startDate, now, gathering.timezone)) {
          continue;
        }

        await this.dispatch.dispatch(
          'prayerMeeting',
          { tenantId: gathering.tenantId },
          {
            title: gathering.title,
            body: 'We are starting now. Tap to join.',
            url: '/dashboard',
            tag: `gathering-${gathering.id}`,
            actions: gathering.joinUrl
              ? [{ action: 'join', title: 'Join', url: gathering.joinUrl }]
              : undefined,
          },
        );
        fired += 1;
      }
      return fired;
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Members of a department or unit, as Profile ids. */
  private async resolveGroupMembers(tenantId: string, groupId: string): Promise<string[]> {
    const unitMembers = await this.prisma.unitMember.findMany({
      where: { unitId: groupId, Member: { tenantId } },
      select: { Member: { select: { profileId: true } } },
    });
    return unitMembers
      .map((u) => u.Member?.profileId)
      .filter((id): id is string => Boolean(id));
  }

  /**
   * Runs `fn`, swallowing and logging any failure.
   *
   * A push problem must never surface as a 500 on the admin action that
   * triggered it, and must never kill the cron runtime for every later job.
   */
  private async safely(label: string, fn: () => Promise<unknown>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this.logger.error(`[${label}] push trigger failed: ${(err as Error).message}`);
    }
  }
}

/**
 * Whether an RRULE occurs on the local date of `now` in the gathering's timezone.
 *
 * An unrecognised rule fires rather than being skipped, so a rule this codebase
 * cannot read is loud instead of silently dead. Writes are validated against
 * `isSupportedRecurrenceRule`, so reaching that branch means a row predates the
 * validation or was written directly to the database.
 */
function occursToday(rule: string, startDate: Date, now: Date, timezone: string): boolean {
  return ruleOccursOn(rule, startDate, localCalendarDate(now, timezone)) !== 'no';
}

function formatLagosTime(date: Date): string {
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function formatLagosDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}...`;
}
