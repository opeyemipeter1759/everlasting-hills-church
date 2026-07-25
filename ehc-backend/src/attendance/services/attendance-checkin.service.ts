import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { AttendanceMemberLookupService } from './attendance-member-lookup.service';
import { AttendanceSessionWindowService } from './attendance-session-window.service';

/** Member self-service check-in. */
@Injectable()
export class AttendanceCheckInService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly memberLookup: AttendanceMemberLookupService,
    private readonly sessionWindow: AttendanceSessionWindowService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async checkIn(userId: string, fallbackEmail?: string) {
    const member = await this.memberLookup.getMemberByUserId(userId, fallbackEmail);
    if (!member) {
      throw new NotFoundException(
        'Your account has no profile yet. Contact an admin.',
      );
    }

    const service = await this.sessionWindow.findOrCreateTodayService();

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: {
        memberId_serviceId: {
          memberId: member.id,
          serviceId: service.id,
        },
      },
    });

    if (existing) {
      return { alreadyCheckedIn: true as const, service };
    }

    await this.prisma.attendanceRecord.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        memberId: member.id,
        serviceId: service.id,
        present: true,
      },
    });

    return { alreadyCheckedIn: false as const, service };
  }

  async checkInByServiceId(
    userId: string,
    serviceId: string,
    fallbackEmail?: string,
  ) {
    const member = await this.memberLookup.getMemberByUserId(userId, fallbackEmail);
    if (!member) {
      throw new NotFoundException(
        'Your account has no profile yet. Contact an admin.',
      );
    }

    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId: this.tenantId },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: {
        memberId_serviceId: {
          memberId: member.id,
          serviceId: service.id,
        },
      },
    });

    if (existing) {
      return { alreadyCheckedIn: true as const, service };
    }

    await this.prisma.attendanceRecord.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        memberId: member.id,
        serviceId: service.id,
        present: true,
      },
    });

    return { alreadyCheckedIn: false as const, service };
  }
}
