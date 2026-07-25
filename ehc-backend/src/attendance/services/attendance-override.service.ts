import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AttendanceStatus } from '../attendance.types';

/** ADMIN manual overrides: single-member status change and bulk marking. */
@Injectable()
export class AttendanceOverrideService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Inline status override — PATCH /attendance/session/:sessionId/member/:userId */
  async overrideAttendance(sessionId: string, userId: string, status: AttendanceStatus) {
    const [service, member] = await Promise.all([
      this.prisma.service.findFirst({
        where: { id: sessionId, tenantId: this.tenantId },
      }),
      this.prisma.member.findFirst({
        where: { id: userId, tenantId: this.tenantId },
      }),
    ]);
    if (!service) throw new NotFoundException('Session not found');
    if (!member) throw new NotFoundException('Member not found');

    const present = status === 'PRESENT';
    const record = await this.prisma.attendanceRecord.upsert({
      where: {
        memberId_serviceId: { memberId: member.id, serviceId: service.id },
      },
      update: { present, markedBy: 'ADMIN', checkedInAt: new Date() },
      create: {
        id: randomUUID(),
        tenantId: this.tenantId,
        memberId: member.id,
        serviceId: service.id,
        present,
        markedBy: 'ADMIN',
      },
    });

    return {
      id: record.id,
      status: record.present ? 'PRESENT' : 'ABSENT',
      markedBy: record.markedBy,
      markedAt: record.checkedInAt.toISOString(),
    };
  }

  /** Bulk mark — PATCH /attendance/session/:sessionId/bulk */
  async bulkMarkAttendance(sessionId: string, userIds: string[], status: AttendanceStatus) {
    const service = await this.prisma.service.findFirst({
      where: { id: sessionId, tenantId: this.tenantId },
    });
    if (!service) throw new NotFoundException('Session not found');

    const members = await this.prisma.member.findMany({
      where: { id: { in: userIds }, tenantId: this.tenantId },
      select: { id: true },
    });
    const present = status === 'PRESENT';

    await Promise.all(
      members.map((m) =>
        this.prisma.attendanceRecord.upsert({
          where: {
            memberId_serviceId: { memberId: m.id, serviceId: service.id },
          },
          update: { present, markedBy: 'ADMIN', checkedInAt: new Date() },
          create: {
            id: randomUUID(),
            tenantId: this.tenantId,
            memberId: m.id,
            serviceId: service.id,
            present,
            markedBy: 'ADMIN',
          },
        }),
      ),
    );
    return { updated: members.length };
  }
}
