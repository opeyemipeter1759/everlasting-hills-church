import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { IcsBuilderService } from './ics-builder.service';
import { buildGatheringOccurrenceStart } from './recurrence.util';

/**
 * Single-event .ics downloads: the "Add to calendar" control on a service, an
 * event, or the prayer meeting.
 *
 * These are public reads by design. A service time and an event listing are
 * already on the public site, so requiring a login to add one to your calendar
 * would only stop first-time visitors from turning up. Nothing member-specific
 * is emitted here — serving assignments appear only in the authenticated
 * subscription feed.
 */
@Injectable()
export class CalendarEventService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ics: IcsBuilderService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async serviceIcs(serviceId: string): Promise<{ filename: string; body: string }> {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId: this.tenantId },
      select: {
        id: true,
        name: true,
        scheduledAt: true,
        durationMinutes: true,
        location: true,
        cancelledAt: true,
        cancelReason: true,
      },
    });
    if (!service) throw new NotFoundException('Service not found');

    const calendar = this.ics.createCalendar({ name: service.name });
    this.ics.addEvent(calendar, {
      uid: `service-${service.id}@everlastinghills`,
      summary: service.name,
      description: service.cancelledAt
        ? service.cancelReason
          ? `This service has been cancelled. ${service.cancelReason}`
          : 'This service has been cancelled.'
        : undefined,
      location: service.location ?? undefined,
      start: service.scheduledAt,
      end: new Date(service.scheduledAt.getTime() + service.durationMinutes * 60_000),
      cancelled: Boolean(service.cancelledAt),
      alarmMinutesBefore: 60,
    });

    return { filename: this.filename(service.name), body: this.ics.toString(calendar) };
  }

  async eventIcs(idOrSlug: string): Promise<{ filename: string; body: string }> {
    const event = await this.prisma.event.findFirst({
      where: {
        tenantId: this.tenantId,
        status: EventStatus.PUBLISHED,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      select: {
        id: true,
        title: true,
        tagline: true,
        startAt: true,
        endAt: true,
        venueName: true,
        venueAddress: true,
        updatedAt: true,
      },
    });
    if (!event) throw new NotFoundException('Event not found');

    const calendar = this.ics.createCalendar({ name: event.title });
    this.ics.addEvent(calendar, {
      uid: `event-${event.id}@everlastinghills`,
      summary: event.title,
      description: event.tagline ?? undefined,
      location: [event.venueName, event.venueAddress].filter(Boolean).join(', ') || undefined,
      start: event.startAt,
      end: event.endAt ?? new Date(event.startAt.getTime() + 2 * 60 * 60_000),
      lastModified: event.updatedAt,
      alarmMinutesBefore: 60,
    });

    return { filename: this.filename(event.title), body: this.ics.toString(calendar) };
  }

  /**
   * The recurring gathering as a standalone recurring VEVENT. This is the
   * one-tap "add the prayer meeting to my phone" download, and it is the path
   * we recommend over push: once it is in the member's calendar, their own
   * app's alert settings apply, which they control and which can be far more
   * insistent than a web notification.
   *
   * Unlike the feed copy, this one carries a VALARM, because a member tapping
   * "add to my phone" is asking to be reminded.
   */
  async gatheringIcs(gatheringId: string): Promise<{ filename: string; body: string }> {
    const gathering = await this.prisma.recurringGathering.findFirst({
      where: { id: gatheringId, tenantId: this.tenantId, isActive: true },
    });
    if (!gathering) throw new NotFoundException('Gathering not found');

    const start = buildGatheringOccurrenceStart(gathering.startDate, gathering.startTime, gathering.timezone);
    const calendar = this.ics.createCalendar({ name: gathering.title });

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
      alarmMinutesBefore: 15,
    });

    return { filename: this.filename(gathering.title), body: this.ics.toString(calendar) };
  }

  /** Safe, readable download filename. */
  private filename(title: string): string {
    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'event';
    return `${slug}.ics`;
  }
}
