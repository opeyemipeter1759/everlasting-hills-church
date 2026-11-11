import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { ReadinessState, ServiceType } from '@prisma/client';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { getTodayBounds } from '../attendance/attendance.types';
import { ServiceCalendarService } from './service-calendar.service';
import { isReadinessType, readinessTimes } from './readiness-schedule';
import { readinessRecordFor } from './readiness-record';
import { ServiceReadinessNotifyService } from './service-readiness-notify.service';
import type { SaveReadinessPlanDto } from './dto/save-readiness-plan.dto';

const PLAN_FIELDS = ['workers', 'equipment', 'done', 'outstanding', 'challenges', 'support'] as const;

/**
 * Stage 1 of the service cycle. Every unit plans for every coming Sunday and
 * Wednesday service; nobody has to switch it on. A unit's leader (lead,
 * assistant, or head of its department) submits the plan, and Admin, Admin
 * Head, Super Admin and Pastor are emailed. Updates and approval live in
 * ServiceReadinessUpdatesService.
 */
@Injectable()
export class ServiceReadinessPlansService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly calendar: ServiceCalendarService,
    private readonly notify: ServiceReadinessNotifyService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** The coming Sunday / Wednesday services (at most `take`), each with a row per unit. */
  async upcoming(take = 2) {
    await this.calendar.ensureUpcoming();
    const services = await this.prisma.service.findMany({
      where: {
        tenantId: this.tenantId,
        scheduledAt: { gte: getTodayBounds().startUtc },
        serviceType: { in: [ServiceType.SUNDAY, ServiceType.WEDNESDAY] },
        cancelledAt: null,
      },
      orderBy: { scheduledAt: 'asc' },
      take,
      select: { id: true, name: true, serviceType: true, scheduledAt: true },
    });
    for (const s of services) await this.ensureRecords(s.id, s.serviceType);
    return services.map((s) => {
      const times = readinessTimes(s.serviceType, s.scheduledAt);
      return { ...s, readyBy: times?.readyBy ?? null, planDue: times?.planDue ?? null, inspections: times?.inspections ?? null };
    });
  }

  /** One NOT_STARTED row per unit for this service; existing rows are left alone. */
  async ensureRecords(serviceId: string, type: ServiceType) {
    if (!isReadinessType(type)) return;
    const units = await this.prisma.unit.findMany({ where: { tenantId: this.tenantId }, select: { id: true } });
    if (!units.length) return;
    await this.prisma.serviceReadiness.createMany({
      data: units.map((u) => ({ id: randomUUID(), tenantId: this.tenantId, serviceId, unitId: u.id })),
      skipDuplicates: true,
    });
  }

  /** Submits (or changes) a unit's plan. A change needs approving again. */
  async savePlan(actor: AuthUser, serviceId: string, unitId: string, dto: SaveReadinessPlanDto) {
    const record = await readinessRecordFor(this.prisma, this.tenantId, actor, serviceId, unitId);
    const text = Object.fromEntries(PLAN_FIELDS.map((f) => [f, dto[f]?.trim() || null]));
    await this.prisma.serviceReadiness.update({
      where: { id: record.id },
      data: {
        ...text,
        canMeetDeadline: dto.canMeetDeadline ?? null,
        state: ReadinessState.CONFIRMED,
        confirmedAt: new Date(),
        confirmedById: actor.profileId,
        approvedAt: null,
        approvedById: null,
      },
    });
    await this.notify.planSubmitted({
      serviceType: record.Service.serviceType,
      unitName: record.Unit.name,
      byProfileId: actor.profileId,
      changed: record.state !== ReadinessState.NOT_STARTED,
      needs: (text.support as string | null) ?? null,
    });
    return { saved: true };
  }
}
