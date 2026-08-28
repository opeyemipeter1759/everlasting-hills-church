import { Injectable } from '@nestjs/common';
import { ServiceType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { MemberHistoryRow } from '../attendance.types';
import { AttendanceMemberLookupService } from './attendance-member-lookup.service';

/** The signed-in member's own attendance history. */
@Injectable()
export class AttendanceHistoryService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly memberLookup: AttendanceMemberLookupService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getMemberAttendance(userId: string) {
    const member = await this.memberLookup.getMemberByUserId(userId);
    if (!member) {
      return [];
    }

    return this.prisma.attendanceRecord.findMany({
      where: {
        memberId: member.id,
        tenantId: this.tenantId,
      },
      include: {
        Service: true,
      },
      orderBy: {
        Service: {
          scheduledAt: 'desc',
        },
      },
    });
  }

  /**
   * Per-service attendance tracking for the signed-in member: one row for every
   * past service, marked present/absent by cross-referencing their check-ins.
   * Powers the member "My Attendance" table (present rows are mode "onsite";
   * absent rows have no mode).
   */
  async getMemberHistory(userId: string) {
    const member = await this.memberLookup.getMemberByUserId(userId);
    if (!member) {
      return { member: null, records: [] as MemberHistoryRow[] };
    }

    // The member's own check-in records first, so we always surface a service
    // they actually attended — even if its scheduled timestamp predates their
    // join time (e.g. a service stamped at midnight that they joined + checked
    // into later the same day).
    const records = await this.prisma.attendanceRecord.findMany({
      where: { memberId: member.id, tenantId: this.tenantId },
      select: { serviceId: true, present: true, checkedInAt: true },
    });
    const recordServiceIds = records.map((r) => r.serviceId);

    // A service appears in the member's history if EITHER:
    //   • they have a check-in for it (always show what they attended), OR
    //   • it occurred on/after they joined (so we can mark genuine absences,
    //     without penalising them for services before they were a member).
    const services = await this.prisma.service.findMany({
      where: {
        tenantId: this.tenantId,
        scheduledAt: { lte: new Date() },
        OR: [
          { scheduledAt: { gte: member.joinedAt } },
          { id: { in: recordServiceIds } },
        ],
      },
      orderBy: { scheduledAt: 'desc' },
      take: 365,
      select: { id: true, name: true, scheduledAt: true, serviceType: true },
    });

    const byService = new Map(records.map((r) => [r.serviceId, r]));
    const rows: MemberHistoryRow[] = services
      // Absence is only meaningful for the services the church actually expects
      // people at — Sunday and Wednesday. SPECIAL covers one-off gatherings and
      // the placeholder services the usher headcount flow creates for any other
      // weekday, and marking the whole congregation absent from a Tuesday that
      // was never a service is how a faithful member ends up looking delinquent.
      // A SPECIAL service still appears when the member has a record for it:
      // attending something extra should count for them, never against.
      .filter((s) => s.serviceType !== ServiceType.SPECIAL || byService.has(s.id))
      .map((s) => {
        const rec = byService.get(s.id);
        const present = rec?.present ?? false;
        return {
          id: s.id,
          serviceName: s.name,
          date: s.scheduledAt.toISOString(),
          status: present ? 'present' : 'absent',
          mode: present ? 'onsite' : null,
        };
      });

    return {
      member: {
        name: `${member.firstName} ${member.lastName}`.trim(),
        email: member.email,
        phone: member.phone,
      },
      records: rows,
    };
  }
}
