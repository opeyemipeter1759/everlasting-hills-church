import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { AttendanceSessionWindowService } from './attendance-session-window.service';

/** Admin dashboard reads: today's roster, service list, next service, simple counts. */
@Injectable()
export class AttendanceOverviewService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionWindow: AttendanceSessionWindowService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getTodayAttendanceWithMembers() {
    const service = await this.sessionWindow.getTodayService();
    if (!service) {
      return null;
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        serviceId: service.id,
        tenantId: this.tenantId,
        present: true,
      },
      include: {
        Member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return { service, records };
  }

  async getAllServicesWithCounts() {
    return this.prisma.service.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { scheduledAt: 'desc' },
      include: {
        _count: {
          select: {
            AttendanceRecord: {
              where: { present: true },
            },
          },
        },
      },
      take: 50,
    });
  }

  async getNextService() {
    return this.prisma.service.findFirst({
      where: {
        tenantId: this.tenantId,
        scheduledAt: { gt: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async countTotalServices() {
    return this.prisma.service.count({ where: { tenantId: this.tenantId } });
  }

  async countTodayCheckIns() {
    const service = await this.sessionWindow.getTodayService();
    if (!service) {
      return 0;
    }

    return this.prisma.attendanceRecord.count({
      where: {
        serviceId: service.id,
        tenantId: this.tenantId,
        present: true,
      },
    });
  }
}
