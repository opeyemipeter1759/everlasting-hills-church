import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReadinessState, ReadinessStatus } from '@prisma/client';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceReadinessPlansService } from './service-readiness-plans.service';
import { unitsHeadedBy } from './readiness-access';
import { PLAN_SELECT, fullName, presentPlans, serviceView } from './readiness-present';

/** What the Administrator's board and a unit leader's page read. */
@Injectable()
export class ServiceReadinessViewsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: ServiceReadinessPlansService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * Every unit for one coming service (the next by default), most in need of
   * attention first: overdue, not submitted, blocked, waiting for approval, approved.
   */
  async board(serviceId?: string, now = new Date()) {
    const services = await this.plans.upcoming(2);
    const selected = services.find((s) => s.id === serviceId) ?? services[0];
    if (!selected) return { services: [], selectedId: null, rows: [] };

    const records = await this.prisma.serviceReadiness.findMany({
      where: { serviceId: selected.id },
      select: {
        ...PLAN_SELECT, unitId: true,
        Unit: { select: { name: true, Department: { select: { name: true } } } },
        Inspections: { select: { round: true, result: true } },
      },
    });
    const overdue = (state: ReadinessState) => state === ReadinessState.NOT_STARTED && !!selected.planDue && now > selected.planDue;
    const rank = (r: { state: ReadinessState; status: ReadinessStatus | null; approvedAt: Date | null }) =>
      overdue(r.state) ? 0 : r.state === ReadinessState.NOT_STARTED ? 1 : r.status === ReadinessStatus.BLOCKED ? 2 : !r.approvedAt ? 3 : 4;

    const rows = (await presentPlans(this.prisma, records))
      .map(({ Unit, Inspections, ...r }) => ({
        ...r,
        unitName: Unit.name,
        department: Unit.Department?.name ?? null,
        overdue: overdue(r.state),
        inspections: {
          DAY_BEFORE: Inspections.find((i) => i.round === 'DAY_BEFORE')?.result ?? null,
          ON_THE_DAY: Inspections.find((i) => i.round === 'ON_THE_DAY')?.result ?? null,
        },
      }))
      .sort((a, b) => rank(a) - rank(b) || a.unitName.localeCompare(b.unitName));
    return { services: services.map(serviceView), selectedId: selected.id, rows };
  }

  /** The units this person leads, for each coming service: their tasks and updates, and last time's task list to copy. */
  async mine(actor: AuthUser) {
    const unitIds = await unitsHeadedBy(this.prisma, this.tenantId, actor);
    if (!unitIds.length) return { items: [] };
    const services = await this.plans.upcoming(2);
    const serviceIds = services.map((s) => s.id);
    const [records, roster] = await Promise.all([
      this.prisma.serviceReadiness.findMany({
        where: { serviceId: { in: serviceIds }, unitId: { in: unitIds } },
        select: { ...PLAN_SELECT, serviceId: true, unitId: true, Unit: { select: { name: true } } },
      }),
      this.prisma.serviceAssignment.findMany({
        where: { serviceId: { in: serviceIds }, unitId: { in: unitIds } },
        select: { serviceId: true, unitId: true, role: true, Member: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    const items = await Promise.all(
      (await presentPlans(this.prisma, records)).map(async ({ Unit, serviceId, unitId, ...plan }) => {
        const service = services.find((s) => s.id === serviceId)!;
        const previous = await this.prisma.serviceReadiness.findFirst({
          where: { unitId, state: { not: ReadinessState.NOT_STARTED }, Service: { serviceType: service.serviceType, scheduledAt: { lt: service.scheduledAt } } },
          orderBy: { Service: { scheduledAt: 'desc' } },
          select: { Tasks: { orderBy: { position: 'asc' }, select: { title: true } } },
        });
        return {
          service: serviceView(service),
          unit: { id: unitId, name: Unit.name },
          plan,
          roster: roster.filter((r) => r.serviceId === serviceId && r.unitId === unitId).map((r) => `${fullName(r.Member)} (${r.role})`),
          previous: previous?.Tasks.length ? previous.Tasks.map((t) => t.title) : null,
        };
      }),
    );
    items.sort((a, b) => a.service.scheduledAt.getTime() - b.service.scheduledAt.getTime() || a.unit.name.localeCompare(b.unit.name));
    return { items };
  }
}
