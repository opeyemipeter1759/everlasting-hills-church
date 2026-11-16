import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { InspectionResult, InspectionRound, ReadinessState } from '@prisma/client';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { readinessTimes } from './readiness-schedule';
import { ServiceReadinessPlansService } from './service-readiness-plans.service';
import type { SaveInspectionDto } from './dto/save-inspection.dto';

/**
 * Stage 2: the Church Administrator inspects every serving department twice —
 * the day before the service (with the department's plan beside its checklist)
 * and 2 hours before. A line not ticked means the department has issues.
 */
@Injectable()
export class ServiceInspectionsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: ServiceReadinessPlansService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Everything needed to inspect one service in one round: each department's checklist, plan and any saved result. */
  async sheet(serviceId: string, round: InspectionRound) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId: this.tenantId },
      select: { id: true, name: true, serviceType: true, scheduledAt: true },
    });
    const times = service && readinessTimes(service.serviceType, service.scheduledAt);
    if (!service || !times) throw new NotFoundException('No Sunday or Wednesday service with that id');
    await this.plans.ensureRecords(service.id, service.serviceType);

    const [records, templates] = await Promise.all([
      this.prisma.serviceReadiness.findMany({
        where: { serviceId },
        select: {
          id: true, unitId: true, state: true, outstanding: true, support: true, canMeetDeadline: true,
          approvedAt: true, status: true, blocker: true,
          Tasks: { where: { done: false }, orderBy: { position: 'asc' }, select: { title: true } },
          Unit: { select: { name: true } },
          Inspections: { where: { round }, select: { result: true, checks: true, note: true, inspectedAt: true } },
        },
      }),
      this.prisma.readinessChecklistItem.findMany({
        where: { tenantId: this.tenantId, serviceType: service.serviceType },
        orderBy: { position: 'asc' },
        select: { unitId: true, label: true },
      }),
    ]);

    return {
      service: { ...service, startsAt: times.startsAt.toISOString() },
      round,
      dueAt: times.inspections[round].toISOString(),
      rows: records
        .map(({ id, Unit, Inspections, Tasks, ...plan }) => ({
          readinessId: id,
          openTasks: Tasks.map((t) => t.title),
          ...plan,
          unitName: Unit.name,
          planMissing: plan.state === ReadinessState.NOT_STARTED,
          checklist: templates.filter((t) => t.unitId === plan.unitId).map((t) => t.label),
          inspection: Inspections[0] ?? null,
        }))
        .sort((a, b) => a.unitName.localeCompare(b.unitName)),
    };
  }

  /** Records (or corrects) one department's inspection for one round. */
  async save(actor: AuthUser, serviceId: string, unitId: string, round: InspectionRound, dto: SaveInspectionDto) {
    const record = await this.prisma.serviceReadiness.findFirst({ where: { tenantId: this.tenantId, serviceId, unitId }, select: { id: true } });
    if (!record) throw new NotFoundException('This department is not serving at that service');

    const checks = dto.checks.map((c) => ({ label: c.label.trim(), passed: c.passed, ...(c.note?.trim() ? { note: c.note.trim() } : {}) }));
    const ready = checks.length ? checks.every((c) => c.passed) : dto.ready !== false;
    const result = ready ? InspectionResult.READY : InspectionResult.ISSUES;
    const data = { result, checks, note: dto.note?.trim() || null, inspectedAt: new Date(), inspectedById: actor.profileId };

    await this.prisma.serviceInspection.upsert({
      where: { readinessId_round: { readinessId: record.id, round } },
      create: { id: randomUUID(), tenantId: this.tenantId, readinessId: record.id, round, ...data },
      update: data,
    });
    return { saved: true, result };
  }
}
