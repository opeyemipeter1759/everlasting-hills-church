import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { ServiceType } from '@prisma/client';
import type { Env } from '../config/env.validation';
import { PrismaService } from '../prisma/prisma.service';
import { getDayBounds } from '../attendance/attendance.types';
import { serviceName, upcomingServiceDays } from './readiness-schedule';

/**
 * Makes sure the coming week's Sunday and Wednesday services exist ahead of
 * time, so departments can plan for them 24 hours before.
 *
 * Until now a service was created on the day, when attendance opened. A
 * service created here has the same shape (scheduledAt = start of the Lagos
 * day, same name and type), and attendance looks a service up by day, so it
 * reuses this one rather than making a second. A day that already has any
 * service — including a Special one — is left alone.
 */
@Injectable()
export class ServiceCalendarService {
  private readonly logger = new Logger(ServiceCalendarService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async ensureUpcoming(now = new Date()): Promise<{ created: number }> {
    let created = 0;
    for (const { dayStart, type } of upcomingServiceDays(now)) {
      const { startUtc, endUtc } = getDayBounds(dayStart);
      const existing = await this.prisma.service.findFirst({
        where: { tenantId: this.tenantId, scheduledAt: { gte: startUtc, lt: endUtc } },
        select: { id: true },
      });
      if (existing) continue;
      await this.prisma.service.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          name: serviceName(type, startUtc),
          scheduledAt: startUtc,
          serviceType: ServiceType[type],
        },
      });
      created++;
    }
    if (created) this.logger.log(`service-calendar: created ${created} upcoming service(s)`);
    return { created };
  }
}
