import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { CHURCH_TIMEZONE, IcsBuilderService } from './ics-builder.service';
import { buildGatheringOccurrenceStart } from './recurrence.util';

/** Rolling window. Past for context, future for planning. */
const WINDOW_PAST_DAYS = 30;
const WINDOW_FUTURE_DAYS = 180;

/** Advisory refresh hint: 6 hours. */
const FEED_TTL_SECONDS = 6 * 60 * 60;

/** Prefix that makes a serving duty unmistakable at a glance in a calendar. */
const SERVING_PREFIX = 'Serving';

/** One row of the in-app "what's on my calendar" list (see `getUpcomingForMember`). */
export interface MemberCalendarItem {
  id: string;
  kind: 'service' | 'event';
  title: string;
  /** ISO 8601 */
  start: string;
  /** ISO 8601 */
  end: string;
  location: string | null;
  cancelled: boolean;
  /** Roles this member is rostered for, when this is a service they're serving at. */
  servingRoles: string[] | null;
  /** Event slug, for linking to its public page. Null for services. */
  slug: string | null;
}

/**
 * Builds the per-member subscription feed.
 *
 * Scope rule, applied without exception: this feed contains only what the
 * member is already entitled to see, and never anything pastoral or personal.
 * No pastoral notes, no prayer request content, no other member's details, no
 * contact information. A feed URL is a bearer credential that will end up
 * synced to third-party servers (Google, Apple, Microsoft) and cached on every
 * device the member owns, so the bar for what goes in is higher than for a
 * logged-in screen, not the same.
 */
@Injectable()
export class CalendarFeedService {
  private readonly defaultTenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ics: IcsBuilderService,
    config: ConfigService<Env, true>,
  ) {
    this.defaultTenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async buildForMember(userId: string, tenantId: string): Promise<string> {
    const now = new Date();
    const from = new Date(now.getTime() - WINDOW_PAST_DAYS * 86_400_000);
    const to = new Date(now.getTime() + WINDOW_FUTURE_DAYS * 86_400_000);

    const calendar = this.ics.createCalendar({
      name: 'Everlasting Hills Church',
      description: 'Services, events and your serving schedule.',
      ttlSeconds: FEED_TTL_SECONDS,
    });

    const { services, events, gatherings, servingRoles } = await this.fetchMemberCalendarData(
      userId,
      tenantId,
      from,
      to,
    );

    for (const service of services) {
      const roles = servingRoles.get(service.id);
      const cancelled = Boolean(service.cancelledAt);

      // The serving prefix is the point of the whole feature: a member scanning
      // their week must be able to tell "I am rostered" from "this is on" at a
      // glance, without opening anything.
      const summary = roles?.length
        ? `${SERVING_PREFIX}: ${service.name} (${roles.join(', ')})`
        : service.name;

      const description = cancelled
        ? service.cancelReason
          ? `This service has been cancelled. ${service.cancelReason}`
          : 'This service has been cancelled.'
        : roles?.length
          ? `You are serving at this service as ${roles.join(', ')}.`
          : undefined;

      this.ics.addEvent(calendar, {
        // Namespaced and stable. Regenerating the feed must update the existing
        // entry rather than create a duplicate, and the serving variant must
        // not collide with the plain one.
        uid: `service-${service.id}@everlastinghills`,
        summary,
        description,
        location: service.location ?? undefined,
        start: service.scheduledAt,
        end: new Date(service.scheduledAt.getTime() + service.durationMinutes * 60_000),
        cancelled,
        // Serving duties get a longer lead time than simply attending.
        alarmMinutesBefore: roles?.length ? 120 : 60,
      });
    }

    for (const event of events) {
      this.ics.addEvent(calendar, {
        uid: `event-${event.id}@everlastinghills`,
        summary: event.title,
        // Tagline only. The full description is member-authored rich text and
        // can carry anything, so it does not go into a feed that syncs to
        // third-party servers.
        description: event.tagline ?? undefined,
        location: [event.venueName, event.venueAddress].filter(Boolean).join(', ') || undefined,
        start: event.startAt,
        // Events without an end time default to two hours rather than emitting
        // a zero-length VEVENT, which some clients render as a bare timestamp.
        end: event.endAt ?? new Date(event.startAt.getTime() + 2 * 60 * 60_000),
        lastModified: event.updatedAt,
        alarmMinutesBefore: 60,
      });
    }

    for (const gathering of gatherings) {
      const start = buildGatheringOccurrenceStart(gathering.startDate, gathering.startTime, gathering.timezone);
      this.ics.addEvent(calendar, {
        uid: `gathering-${gathering.id}@everlastinghills`,
        summary: gathering.title,
        description: [gathering.description, gathering.joinUrl && `Join: ${gathering.joinUrl}`]
          .filter(Boolean)
          .join('\n\n') || undefined,
        url: gathering.joinUrl ?? undefined,
        start,
        end: new Date(start.getTime() + gathering.durationMinutes * 60_000),
        repeating: gathering.recurrenceRule,
        // Deliberately no VALARM. The member controls the alert on a recurring
        // entry through their own calendar app, which can be far more insistent
        // than anything the web can do, and a duplicate reminder from us on a
        // daily event is exactly how people end up muting the whole calendar.
      });
    }

    return this.ics.toString(calendar);
  }

  /**
   * Same underlying data as `buildForMember`, as plain JSON instead of ICS —
   * for showing "what's on my calendar" inside the app itself, so a member
   * sees it immediately rather than waiting on Google's own polling schedule
   * for the .ics feed. Forward-looking only: past services aren't "upcoming".
   */
  async getUpcomingForMember(actor: AuthUser): Promise<MemberCalendarItem[]> {
    if (!actor.profileId) {
      throw new NotFoundException('No profile is linked to this account');
    }
    return this.getUpcomingForMemberById(actor.profileId, actor.tenantId ?? this.defaultTenantId);
  }

  /** Same as `getUpcomingForMember`, for callers that already have resolved ids (e.g. the Google sync job). */
  async getUpcomingForMemberById(userId: string, tenantId: string): Promise<MemberCalendarItem[]> {
    const now = new Date();
    const to = new Date(now.getTime() + WINDOW_FUTURE_DAYS * 86_400_000);
    const { services, events, servingRoles } = await this.fetchMemberCalendarData(
      userId,
      tenantId,
      now,
      to,
    );

    const items: MemberCalendarItem[] = [];

    for (const service of services) {
      const roles = servingRoles.get(service.id) ?? null;
      items.push({
        id: service.id,
        kind: 'service',
        title: service.name,
        start: service.scheduledAt.toISOString(),
        end: new Date(service.scheduledAt.getTime() + service.durationMinutes * 60_000).toISOString(),
        location: service.location,
        cancelled: Boolean(service.cancelledAt),
        servingRoles: roles?.length ? roles : null,
        slug: null,
      });
    }

    for (const event of events) {
      items.push({
        id: event.id,
        kind: 'event',
        title: event.title,
        start: event.startAt.toISOString(),
        end: (event.endAt ?? new Date(event.startAt.getTime() + 2 * 60 * 60_000)).toISOString(),
        location: [event.venueName, event.venueAddress].filter(Boolean).join(', ') || null,
        cancelled: false,
        servingRoles: null,
        slug: event.slug,
      });
    }

    items.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return items;
  }

  /** Shared query set behind both `buildForMember` and `getUpcomingForMember`. */
  private async fetchMemberCalendarData(userId: string, tenantId: string, from: Date, to: Date) {
    // The member row is what ServiceAssignment points at; a profile without one
    // simply has no serving duties rather than being an error.
    const member = await this.prisma.member.findFirst({
      where: { profileId: userId, tenantId },
      select: { id: true },
    });

    const [services, events, assignments, gatherings] = await Promise.all([
      this.prisma.service.findMany({
        where: { tenantId, scheduledAt: { gte: from, lte: to } },
        select: {
          id: true,
          name: true,
          scheduledAt: true,
          durationMinutes: true,
          location: true,
          cancelledAt: true,
          cancelReason: true,
        },
        orderBy: { scheduledAt: 'asc' },
      }),
      this.prisma.event.findMany({
        where: {
          tenantId,
          status: EventStatus.PUBLISHED,
          startAt: { gte: from, lte: to },
        },
        select: {
          id: true,
          slug: true,
          title: true,
          tagline: true,
          startAt: true,
          endAt: true,
          venueName: true,
          venueAddress: true,
          updatedAt: true,
        },
        orderBy: { startAt: 'asc' },
      }),
      member
        ? this.prisma.serviceAssignment.findMany({
            where: {
              tenantId,
              memberId: member.id,
              Service: { scheduledAt: { gte: from, lte: to } },
            },
            select: { serviceId: true, role: true },
          })
        : Promise.resolve([]),
      this.prisma.recurringGathering.findMany({
        where: { tenantId, isActive: true },
      }),
    ]);

    // serviceId -> the roles this member serves in at that service.
    const servingRoles = new Map<string, string[]>();
    for (const a of assignments) {
      const list = servingRoles.get(a.serviceId) ?? [];
      list.push(a.role);
      servingRoles.set(a.serviceId, list);
    }

    return { services, events, gatherings, servingRoles };
  }

  /** Timezone every event in this feed is emitted in. */
  get timezone(): string {
    return CHURCH_TIMEZONE;
  }
}
