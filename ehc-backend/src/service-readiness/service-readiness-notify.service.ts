import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Env } from '../config/env.validation';
import { PrismaService } from '../prisma/prisma.service';
import { PushDispatchService } from '../push/services/push-dispatch.service';
import { NotificationEvents, type SendEmailPayload } from '../notifications/notification-events';
import { buildPlanReminderEmail, buildPlanSubmittedEmail, buildStatusUpdateEmail } from '../notifications/templates/service-readiness.email';
import { ADMINISTRATOR_ROLES, headsOfUnits } from './readiness-access';

const BOARD_PATH = '/dashboard/admin/service-readiness';
const PLAN_PATH = '/dashboard/service-readiness';
const dayOf = (type: string) => (type === 'SUNDAY' ? 'Sunday' : 'Wednesday');

/**
 * Who hears what about Service Readiness:
 * - unit leaders (leads and assistants): a reminder, by email and push, when their plan isn't in;
 * - Admin, Admin Head, Super Admin and Pastor: an email each time a unit submits its plan or posts an update.
 * Sends are awaited (emitAsync) so they finish inside the request or job on Cloud Run.
 */
@Injectable()
export class ServiceReadinessNotifyService {
  private readonly tenantId: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushDispatchService,
    private readonly events: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl = (config.get('FRONTEND_URL', { infer: true }) ?? 'https://everlastinghills.church').replace(/\/$/, '');
  }

  /** Reminds each unit's leaders that its plan for this service isn't in. */
  async remindLeaders(service: { id: string; serviceType: string; planDue: Date }, units: { unitId: string; unitName: string }[]) {
    const heads = await headsOfUnits(this.prisma, units.map((u) => u.unitId));
    const day = dayOf(service.serviceType);
    const link = `${this.appUrl}${PLAN_PATH}`;
    for (const unit of units) {
      const profileIds = heads.get(unit.unitId) ?? [];
      for (const to of await this.emailsOf(profileIds)) {
        await this.send(buildPlanReminderEmail({ to, unitName: unit.unitName, day, planDue: service.planDue, link }));
      }
    }
    const everyone = [...new Set(units.flatMap((u) => heads.get(u.unitId) ?? []))];
    if (everyone.length) {
      await this.push.dispatch('servingReminder', { tenantId: this.tenantId, userIds: everyone }, {
        title: `Your plan for ${day}'s service is due soon`,
        body: 'Submit who is serving, what you need and what is outstanding.',
        url: PLAN_PATH,
        tag: `readiness-plan-${service.id}`,
      });
    }
  }

  async planSubmitted(a: { serviceType: string; unitName: string; byProfileId: string | null; changed: boolean; needs: string | null }) {
    const by = await this.nameOf(a.byProfileId);
    const link = `${this.appUrl}${BOARD_PATH}`;
    for (const to of await this.administratorEmails()) {
      await this.send(buildPlanSubmittedEmail({ to, unitName: a.unitName, day: dayOf(a.serviceType), by, changed: a.changed, needs: a.needs, link }));
    }
  }

  async statusUpdated(a: { serviceType: string; unitName: string; byProfileId: string | null; blocked: boolean; note: string | null }) {
    const by = await this.nameOf(a.byProfileId);
    const link = `${this.appUrl}${BOARD_PATH}`;
    for (const to of await this.administratorEmails()) {
      await this.send(buildStatusUpdateEmail({ to, unitName: a.unitName, day: dayOf(a.serviceType), by, blocked: a.blocked, note: a.note, link }));
    }
  }

  /** Everyone holding Admin, Admin Head, Super Admin or Pastor. */
  private async administratorEmails(): Promise<string[]> {
    const grants = await this.prisma.roleGrant.findMany({ where: { role: { in: ADMINISTRATOR_ROLES }, endedAt: null }, select: { userId: true } });
    return this.emailsOf([...new Set(grants.map((g) => g.userId))]);
  }

  private async emailsOf(profileIds: string[]): Promise<string[]> {
    if (!profileIds.length) return [];
    const members = await this.prisma.member.findMany({
      where: { profileId: { in: profileIds }, status: 'ACTIVE', email: { not: null } },
      select: { email: true },
    });
    return [...new Set(members.map((m) => m.email!.trim().toLowerCase()).filter(Boolean))];
  }

  private async nameOf(profileId: string | null): Promise<string> {
    if (!profileId) return 'Someone';
    const m = await this.prisma.member.findFirst({ where: { profileId }, select: { firstName: true, lastName: true } });
    return m ? `${m.firstName} ${m.lastName}`.trim() : 'Someone';
  }

  private send(payload: SendEmailPayload) {
    return this.events.emitAsync(NotificationEvents.SendEmail, payload);
  }
}
