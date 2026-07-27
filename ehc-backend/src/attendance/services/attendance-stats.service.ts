import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

/** Dashboard chart data: recent-services stats, trend, day-of-week breakdown, top attendees. */
@Injectable()
export class AttendanceStatsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getRecentServicesStats(limit = 4) {
    return this.prisma.service.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { scheduledAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: {
            AttendanceRecord: { where: { present: true } },
          },
        },
      },
    });
  }

  async getAttendanceTrend(limit = 16) {
    const services = await this.prisma.service.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { scheduledAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: {
            AttendanceRecord: { where: { present: true } },
          },
        },
      },
    });

    return [...services].reverse().map((service) => ({
      id: service.id,
      name: service.name,
      date: service.scheduledAt.toISOString(),
      label: service.scheduledAt.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      }),
      count: service._count.AttendanceRecord,
    }));
  }

  async getAttendanceByDayOfWeek() {
    const services = await this.prisma.service.findMany({
      where: { tenantId: this.tenantId },
      include: {
        _count: {
          select: {
            AttendanceRecord: { where: { present: true } },
          },
        },
      },
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const totals = new Array(7).fill(0);
    const counts = new Array(7).fill(0);

    services.forEach((service) => {
      const dayOfWeek = new Date(service.scheduledAt).getDay();
      totals[dayOfWeek] += service._count.AttendanceRecord;
      counts[dayOfWeek] += 1;
    });

    return days.map((label, index) => ({
      label,
      avg: counts[index] > 0 ? Math.round(totals[index] / counts[index]) : 0,
      total: totals[index],
    }));
  }

  async getTopAttendees(limit = 10) {
    const records = await this.prisma.attendanceRecord.groupBy({
      by: ['memberId'],
      where: { tenantId: this.tenantId, present: true },
      _count: { _all: true },
      orderBy: { _count: { memberId: 'desc' } },
      take: limit,
    });

    const memberIds = records.map((record) => record.memberId);
    const members = await this.prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, firstName: true, lastName: true, photoUrl: true },
    });

    const memberMap = Object.fromEntries(
      members.map((member) => [member.id, member]),
    );

    return records.map((record) => {
      const member = memberMap[record.memberId];
      return {
        memberId: record.memberId,
        name: member ? `${member.firstName} ${member.lastName}` : 'Unknown',
        photoUrl: member?.photoUrl ?? null,
        count: record._count._all,
      };
    });
  }
}
