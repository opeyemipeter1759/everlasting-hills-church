import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { ServiceType } from '@prisma/client';
import type { Env } from '../config/env.validation';
import { PrismaService } from '../prisma/prisma.service';
import { getTodayBounds } from '../attendance/attendance.types';
import { ServiceCalendarService } from './service-calendar.service';
import { isReadinessType, readinessTimes } from './readiness-schedule';
import type { UpdateReadinessUnitDto } from './dto/update-readiness-unit.dto';

const clean = (labels: string[]) => labels.map((l) => l.trim()).filter(Boolean);

/**
 * Service Readiness setup: every unit plans for every Sunday and Wednesday
 * service, so the Church Administrator only writes each unit's inspection
 * checklists. The coming services are listed with their ready-by and plan-due times.
 */
@Injectable()
export class ServiceReadinessSetupService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly calendar: ServiceCalendarService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async setup() {
    // Idempotent: also covers the days before the Cloud Scheduler job exists.
    await this.calendar.ensureUpcoming();

    const [units, services] = await Promise.all([
      this.prisma.unit.findMany({
        where: { tenantId: this.tenantId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          Department: { select: { id: true, name: true } },
          ReadinessChecklistItem: { orderBy: { position: 'asc' }, select: { serviceType: true, label: true } },
        },
      }),
      this.prisma.service.findMany({
        where: {
          tenantId: this.tenantId,
          scheduledAt: { gte: getTodayBounds().startUtc },
          serviceType: { in: [ServiceType.SUNDAY, ServiceType.WEDNESDAY] },
          cancelledAt: null,
        },
        orderBy: { scheduledAt: 'asc' },
        take: 2,
        select: { id: true, name: true, serviceType: true, scheduledAt: true },
      }),
    ]);

    return {
      units: units.map((u) => ({
        id: u.id,
        name: u.name,
        department: u.Department,
        sundayChecklist: u.ReadinessChecklistItem.filter((i) => i.serviceType === ServiceType.SUNDAY).map((i) => i.label),
        wednesdayChecklist: u.ReadinessChecklistItem.filter((i) => i.serviceType === ServiceType.WEDNESDAY).map((i) => i.label),
      })),
      upcoming: services.map((s) => {
        const times = readinessTimes(s.serviceType, s.scheduledAt);
        return {
          ...s,
          readyBy: times?.readyBy.toISOString() ?? null,
          planDue: times?.planDue.toISOString() ?? null,
          departmentsServing: isReadinessType(s.serviceType) ? units.length : 0,
        };
      }),
    };
  }

  /** Saves both of a unit's checklists together; the lists replace what was there. */
  async updateUnit(unitId: string, dto: UpdateReadinessUnitDto) {
    const unit = await this.prisma.unit.findFirst({ where: { id: unitId, tenantId: this.tenantId }, select: { id: true } });
    if (!unit) throw new NotFoundException('Unit not found');

    const items = [
      ...clean(dto.sundayChecklist).map((label, position) => ({ label, position, serviceType: ServiceType.SUNDAY })),
      ...clean(dto.wednesdayChecklist).map((label, position) => ({ label, position, serviceType: ServiceType.WEDNESDAY })),
    ].map((i) => ({ ...i, id: randomUUID(), tenantId: this.tenantId, unitId }));

    await this.prisma.$transaction([
      this.prisma.readinessChecklistItem.deleteMany({ where: { unitId } }),
      this.prisma.readinessChecklistItem.createMany({ data: items }),
    ]);
    return this.setup();
  }
}
