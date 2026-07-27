import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { EVENT_CALENDAR_SELECT } from '../events.util';

@Injectable()
export class EventsCalendarService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * Admin: every event overlapping [from, to], drafts included.
   *
   * An event occupies [startAt, endAt ?? startAt], so it overlaps the window when it
   * starts on or before `to` and ends on or after `from`. Single-instant events (endAt
   * null) are matched on startAt instead, which is why the OR is needed: `endAt: {gte}`
   * alone would silently drop every event without an end time.
   */
  async listForCalendar(from: Date, to: Date) {
    if (from > to) {
      throw new BadRequestException('`from` must be on or before `to`.');
    }
    return this.prisma.event.findMany({
      where: {
        tenantId: this.tenantId,
        startAt: { lte: to },
        OR: [{ endAt: { gte: from } }, { endAt: null, startAt: { gte: from } }],
      },
      orderBy: [{ startAt: 'asc' }],
      select: EVENT_CALENDAR_SELECT,
    });
  }

  /**
   * Admin: the dashboard calendar summary — the next few published events plus the
   * counts the superadmin home shows. `now` is passed in so the window boundaries and
   * the "upcoming" cutoff come from one clock reading rather than drifting apart.
   */
  async calendarSummary(now: Date = new Date()) {
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const published = { tenantId: this.tenantId, status: EventStatus.PUBLISHED };

    const [upcoming, thisWeek, thisMonth, drafts] = await Promise.all([
      this.prisma.event.findMany({
        where: { ...published, startAt: { gte: now } },
        orderBy: [{ startAt: 'asc' }],
        take: 5,
        select: EVENT_CALENDAR_SELECT,
      }),
      this.prisma.event.count({
        where: { ...published, startAt: { gte: startOfWeek, lt: endOfWeek } },
      }),
      this.prisma.event.count({
        where: { ...published, startAt: { gte: startOfMonth, lt: startOfNextMonth } },
      }),
      this.prisma.event.count({
        where: { tenantId: this.tenantId, status: EventStatus.DRAFT },
      }),
    ]);

    return { upcoming, counts: { thisWeek, thisMonth, drafts } };
  }
}
