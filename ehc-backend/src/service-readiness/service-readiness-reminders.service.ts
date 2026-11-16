import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReadinessState } from '@prisma/client';
import type { Env } from '../config/env.validation';
import { PrismaService } from '../prisma/prisma.service';
import { PushDispatchService } from '../push/services/push-dispatch.service';
import { ServiceReadinessPlansService } from './service-readiness-plans.service';
import { ADMINISTRATOR_ROLES } from './readiness-access';
import { ServiceReadinessNotifyService } from './service-readiness-notify.service';

/** Unit leaders are emailed and pushed this long before their plan is due (Sunday: Friday 7:45 pm). */
export const REMIND_HOURS_BEFORE_DUE = 12;
/** The Administrator hears about missing plans this long after they were due (Sunday: Saturday 11:45 am). */
export const ESCALATE_HOURS_AFTER_DUE = 4;
const HOUR = 3_600_000;
const BOARD_URL = '/dashboard/admin/service-readiness';

/**
 * Runs every 15 minutes (Cloud Scheduler → POST /jobs/service-readiness-reminders).
 * Each unit is reminded once and escalated once per service; the
 * timestamps on its row make a re-run, or a retry, a no-op.
 */
@Injectable()
export class ServiceReadinessRemindersService {
  private readonly logger = new Logger(ServiceReadinessRemindersService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: ServiceReadinessPlansService,
    private readonly push: PushDispatchService,
    private readonly notify: ServiceReadinessNotifyService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async run(now = new Date()) {
    let reminded = 0;
    let escalated = 0;
    for (const service of await this.plans.upcoming(2)) {
      if (!service.planDue || !service.readyBy || now >= service.readyBy) continue;
      const due = service.planDue.getTime();
      const day = service.serviceType === 'SUNDAY' ? 'Sunday' : 'Wednesday';

      if (now.getTime() >= due - REMIND_HOURS_BEFORE_DUE * HOUR && now.getTime() < due) {
        const rows = await this.prisma.serviceReadiness.findMany({
          where: { serviceId: service.id, state: ReadinessState.NOT_STARTED, remindedAt: null },
          select: { id: true, unitId: true, Unit: { select: { name: true } } },
        });
        if (rows.length) {
          await this.notify.remindLeaders(
            { id: service.id, serviceType: service.serviceType, planDue: service.planDue },
            rows.map((r) => ({ unitId: r.unitId, unitName: r.Unit.name })),
          );
          await this.prisma.serviceReadiness.updateMany({ where: { id: { in: rows.map((r) => r.id) } }, data: { remindedAt: now } });
        }
        reminded += rows.length;
      }

      if (now.getTime() >= due + ESCALATE_HOURS_AFTER_DUE * HOUR) {
        const rows = await this.prisma.serviceReadiness.findMany({
          where: { serviceId: service.id, state: ReadinessState.NOT_STARTED, escalatedAt: null },
          select: { id: true, Unit: { select: { name: true } } },
        });
        if (!rows.length) continue;
        const admins = await this.prisma.roleGrant.findMany({
          where: { role: { in: ADMINISTRATOR_ROLES }, endedAt: null },
          select: { userId: true },
        });
        const names = rows.map((r) => r.Unit.name);
        await this.push.dispatch('servingReminder', { tenantId: this.tenantId, userIds: [...new Set(admins.map((a) => a.userId))] }, {
          title: `${rows.length} unit${rows.length === 1 ? " hasn't" : "s haven't"} planned for ${day}`,
          body: names.slice(0, 4).join(', ') + (names.length > 4 ? ` and ${names.length - 4} more` : ''),
          url: BOARD_URL,
          tag: `readiness-escalation-${service.id}`,
        });
        await this.prisma.serviceReadiness.updateMany({ where: { id: { in: rows.map((r) => r.id) } }, data: { escalatedAt: now } });
        escalated += rows.length;
      }
    }
    if (reminded || escalated) this.logger.log(`service-readiness-reminders: reminded ${reminded}, escalated ${escalated}`);
    return { reminded, escalated };
  }
}
