import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InboxService } from '../../inbox/inbox.service';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildFollowUpAssignedEmail } from '../../notifications/templates/follow-up-assigned.email';
import type { Env } from '../../config/env.validation';

export interface EmailRecipient {
  profileId: string;
  name: string;
  email: string | null;
  phone: string | null;
}

/** Central place for every "tell a human" side effect the Follow-Up pipeline
 * fires — in-app notification bell + fire-and-forget email. Keeps the actual
 * pipeline services (intake, progress, escalation, reports) free of dispatch
 * plumbing. */
@Injectable()
export class FollowUpNotifyService {
  private readonly tenantId: string;
  readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inbox: InboxService,
    private readonly events: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl = config.get('FRONTEND_URL', { infer: true }) ?? 'https://www.everlastinghills.church';
  }

  async notifyAssigned(assigneeMemberId: string, subjectName: string, entryId?: string): Promise<void> {
    const member = await this.prisma.member.findUnique({
      where: { id: assigneeMemberId },
      select: { profileId: true, email: true, firstName: true },
    });
    if (!member) return;

    await this.inbox.createMany([
      {
        tenantId: this.tenantId,
        profileId: member.profileId,
        title: `You've been assigned to ${subjectName}`,
        body: 'Open the Follow-Up Pipeline to get started.',
        type: 'follow-up-assigned',
        link: entryId ? `/dashboard/follow-up?entry=${entryId}` : '/dashboard/follow-up',
      },
    ]);

    if (member.email) {
      this.events.emit(
        NotificationEvents.SendEmail,
        buildFollowUpAssignedEmail({
          to: member.email,
          workerFirstName: member.firstName,
          subjectName,
          appUrl: this.appUrl,
        }),
      );
    }
  }

  async notifyProfile(profileId: string, title: string, body: string, link: string, type: string): Promise<void> {
    await this.inbox.createMany([{ tenantId: this.tenantId, profileId, title, body, type, link }]);
  }

  /** Every active Pastor, with best-effort contact details for email/WhatsApp. */
  async getPastorRecipients(): Promise<EmailRecipient[]> {
    const grants = await this.prisma.roleGrant.findMany({
      where: { tenantId: this.tenantId, role: Role.PASTOR, endedAt: null },
      select: {
        userId: true,
        User: { select: { Member: { select: { firstName: true, lastName: true, email: true, phone: true } } } },
      },
    });
    return grants.map((g) => ({
      profileId: g.userId,
      name: g.User.Member ? `${g.User.Member.firstName} ${g.User.Member.lastName}`.trim() : 'Pastor',
      email: g.User.Member?.email ?? null,
      phone: g.User.Member?.phone ?? null,
    }));
  }

  /** The active Admin Head over a unit's department, if the unit has one. */
  async getUnitAdminHeadRecipients(unitId: string): Promise<EmailRecipient[]> {
    const unit = await this.prisma.unit.findFirst({ where: { id: unitId }, select: { departmentId: true } });
    if (!unit?.departmentId) return [];
    const heads = await this.prisma.departmentHead.findMany({
      where: { tenantId: this.tenantId, departmentId: unit.departmentId, endedAt: null },
      select: {
        userId: true,
        User: { select: { Member: { select: { firstName: true, lastName: true, email: true, phone: true } } } },
      },
    });
    return heads.map((h) => ({
      profileId: h.userId,
      name: h.User.Member ? `${h.User.Member.firstName} ${h.User.Member.lastName}`.trim() : 'Admin Head',
      email: h.User.Member?.email ?? null,
      phone: h.User.Member?.phone ?? null,
    }));
  }
}
