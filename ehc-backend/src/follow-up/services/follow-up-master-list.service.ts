import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { getDayBounds } from '../../attendance/attendance.types';
import { FollowUpRollService, type RollRow } from './follow-up-roll.service';
import { summariseAbsence, type AbsenceSummary, type CountedService } from './absence.util';
import {
  LATEST_SERVICE,
  matchesFilters,
  missedService,
  type MasterListFilters,
  type ServiceAttendance,
} from './master-list-filter.util';

/**
 * Everyone the church is responsible for, narrowed and paged. First-timers
 * come first — they exist only as a form somebody filled in, which makes them
 * the easiest people to forget, and not forgetting anyone is the point.
 *
 * Filtering happens here rather than in SQL because a person's status is
 * worked out in code, which keeps the totals and the paging honest instead of
 * counting only what happens to be on the current page.
 */
@Injectable()
export class FollowUpMasterListService {
  private readonly tenantId: string;

  constructor(
    private readonly roll: FollowUpRollService,
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async list(opts: MasterListFilters) {
    const [everyone, services] = await Promise.all([this.roll.everyone(opts.search ?? ''), this.countedServices()]);

    // "latest" is the most recent service that counts, so the Integration
    // Team's list can open on it without first looking up which one that is.
    const latestId = services[0]?.id ?? null;
    const absentFrom = opts.absentFrom === LATEST_SERVICE ? latestId : opts.absentFrom || null;
    const attendance = opts.absentFrom ? (absentFrom ? await this.serviceAttendance(absentFrom) : null) : undefined;

    const matching = everyone.filter(
      (row) =>
        matchesFilters(row, opts) &&
        (attendance === undefined || (attendance !== null && missedService(row, attendance))),
    );
    const take = Math.min(opts.take, 200);
    const page = matching.slice(opts.skip, opts.skip + take);

    // How many of the people this filter matches were absent — from the
    // service being filtered on, or else the latest one — for the Absent
    // card, which follows the filters rather than counting the whole roll.
    const absenceServiceId = absentFrom ?? latestId;
    const reference =
      attendance !== undefined ? attendance : absenceServiceId ? await this.serviceAttendance(absenceServiceId) : null;
    const absent = reference ? matching.filter((row) => missedService(row, reference)).length : 0;

    return {
      data: await this.withAbsences(page, services),
      meta: { total: matching.length, take: opts.take, skip: opts.skip, absent, absenceServiceId },
    };
  }

  /**
   * How often each member on this page has been absent, out of the services
   * held since they joined. Worked out for the page only, not the whole roll,
   * so it costs the same however large the church gets. First-timers without
   * an account have no attendance of their own, so theirs is null.
   */
  private async withAbsences(
    rows: RollRow[],
    services: CountedService[],
  ): Promise<(RollRow & { absence: AbsenceSummary | null })[]> {
    const memberIds = rows.filter((r) => r.kind === 'MEMBER').map((r) => r.id);
    if (memberIds.length === 0) return rows.map((r) => ({ ...r, absence: null }));

    const present = services.length
      ? await this.prisma.attendanceRecord.findMany({
          where: {
            tenantId: this.tenantId,
            present: true,
            memberId: { in: memberIds },
            serviceId: { in: services.map((s) => s.id) },
          },
          select: { memberId: true, serviceId: true },
        })
      : [];
    const attendedBy = new Map<string, Set<string>>();
    for (const r of present) {
      if (!attendedBy.has(r.memberId)) attendedBy.set(r.memberId, new Set());
      attendedBy.get(r.memberId)!.add(r.serviceId);
    }

    return rows.map((r) => ({
      ...r,
      absence:
        r.kind === 'MEMBER'
          ? summariseAbsence(new Date(r.since).getTime(), services, attendedBy.get(r.id) ?? new Set())
          : null,
    }));
  }

  /**
   * The services a member can be absent from, newest first: Sundays and
   * Wednesdays from before today where attendance was actually taken. Today's
   * is left out because its check-in may still be open. A service nobody
   * checked in for means the register wasn't kept, not that the whole church
   * stayed home; SPECIAL services aren't called for everyone.
   */
  private async countedServices(): Promise<CountedService[]> {
    const services = await this.prisma.service.findMany({
      where: {
        tenantId: this.tenantId,
        scheduledAt: { lt: getDayBounds(new Date()).startUtc },
        serviceType: { in: [ServiceType.SUNDAY, ServiceType.WEDNESDAY] },
        AttendanceRecord: { some: { present: true } },
      },
      orderBy: { scheduledAt: 'desc' },
      select: { id: true, scheduledAt: true },
    });
    return services.map((s) => ({ id: s.id, dayEndMs: getDayBounds(s.scheduledAt).endUtc.getTime() }));
  }

  /**
   * Who checked in for a service. Null when nobody can have been absent from
   * it: it doesn't exist, it was a SPECIAL service not called for everyone,
   * or nobody checked in at all, which means attendance was never taken.
   */
  private async serviceAttendance(serviceId: string): Promise<ServiceAttendance | null> {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId: this.tenantId },
      select: { scheduledAt: true, serviceType: true },
    });
    if (!service || service.serviceType === ServiceType.SPECIAL) return null;

    const present = await this.prisma.attendanceRecord.findMany({
      where: { serviceId, tenantId: this.tenantId, present: true },
      select: { memberId: true },
    });
    if (present.length === 0) return null;

    return {
      presentIds: new Set(present.map((r) => r.memberId)),
      dayEndMs: getDayBounds(service.scheduledAt).endUtc.getTime(),
    };
  }
}
