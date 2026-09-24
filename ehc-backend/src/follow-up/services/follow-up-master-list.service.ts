import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { getDayBounds } from '../../attendance/attendance.types';
import { FollowUpRollService } from './follow-up-roll.service';
import {
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
    const [everyone, attendance] = await Promise.all([
      this.roll.everyone(opts.search ?? ''),
      opts.absentFrom ? this.serviceAttendance(opts.absentFrom) : Promise.resolve(undefined),
    ]);
    const matching = everyone.filter(
      (row) =>
        matchesFilters(row, opts) &&
        (attendance === undefined || (attendance !== null && missedService(row, attendance))),
    );
    const take = Math.min(opts.take, 200);

    return {
      data: matching.slice(opts.skip, opts.skip + take),
      meta: { total: matching.length, take: opts.take, skip: opts.skip },
    };
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
