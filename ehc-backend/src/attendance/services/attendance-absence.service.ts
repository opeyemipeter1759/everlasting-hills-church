import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

/**
 * Marks every member who has NO present record for a service as ABSENT. Called
 * automatically when a session window closes (see SessionsService), and exposed
 * as a manual admin endpoint too.
 */
@Injectable()
export class AttendanceAbsenceService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async markMissingAsAbsent(serviceId: string): Promise<{ marked: number }> {
    const [service, members] = await Promise.all([
      this.prisma.service.findUnique({ where: { id: serviceId } }),
      this.prisma.member.findMany({
        where: { tenantId: this.tenantId },
        select: { id: true },
      }),
    ]);
    if (!service) return { marked: 0 };

    const existing = await this.prisma.attendanceRecord.findMany({
      where: { serviceId, tenantId: this.tenantId, present: true },
      select: { memberId: true },
    });
    const presentIds = new Set(existing.map((r) => r.memberId));
    const absentMembers = members.filter((m) => !presentIds.has(m.id));

    if (absentMembers.length === 0) return { marked: 0 };

    await Promise.all(
      absentMembers.map((m) =>
        this.prisma.attendanceRecord.upsert({
          where: { memberId_serviceId: { memberId: m.id, serviceId } },
          create: {
            id: randomUUID(),
            tenantId: this.tenantId,
            memberId: m.id,
            serviceId,
            present: false,
            markedBy: 'ADMIN',
            checkedInAt: new Date(),
          },
          update: { present: false, markedBy: 'ADMIN' },
        }),
      ),
    );

    return { marked: absentMembers.length };
  }
}
