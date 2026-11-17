import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildAccountDeactivationEmail } from '../../notifications/templates/account-deactivation.email';
import { EffectiveRolesService } from '../../auth/effective-roles.service';
import { leaveServiceTeams } from '../leave-service-teams';
import { inactiveAmong, optOutDeactivated, restoreReactivated } from '../../follow-up/deactivation-stage';
import { MemberSelfLookupService } from './member-self-lookup.service';

/** Days a member has to reverse a self-deactivation before data may be removed. */
const DEACTIVATION_REVERSAL_DAYS = 14;

/** Self-service account deactivation/reactivation. */
@Injectable()
export class MemberDeactivationService {
  private readonly appUrl: string;
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly selfLookup: MemberSelfLookupService,
    private readonly effectiveRoles: EffectiveRolesService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl =
      (config.get('FRONTEND_URL', { infer: true }) as string | undefined) ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'http://localhost:3000';
  }

  /**
   * Member-initiated account deactivation. Marks the account INACTIVE and stamps
   * the request time (start of the reversal window), then sends a confirmation
   * email explaining what happens and how to reverse it.
   */
  async requestDeactivation(userId: string, fallbackEmail?: string) {
    const { memberId } = await this.selfLookup.getMyMember(userId, fallbackEmail);
    const { member, leadsEnded } = await this.prisma.$transaction(async (tx) => {
      const row = await tx.member.update({
        where: { id: memberId },
        data: { status: 'INACTIVE', deactivationRequestedAt: new Date() },
        select: { id: true, firstName: true, email: true },
      });
      // A deactivated member serves on no team, and their follow-up is opted out.
      const ended = await leaveServiceTeams(tx, this.tenantId, [memberId], userId);
      await optOutDeactivated(tx, this.tenantId, [memberId], userId);
      return { member: row, leadsEnded: ended };
    });
    leadsEnded.forEach((profileId) => this.effectiveRoles.invalidate(profileId));

    if (member.email) {
      this.events.emit(
        NotificationEvents.SendEmail,
        buildAccountDeactivationEmail({
          email: member.email,
          firstName: member.firstName,
          reversalDays: DEACTIVATION_REVERSAL_DAYS,
          appUrl: this.appUrl,
        }),
      );
    }

    return {
      success: true,
      status: 'INACTIVE',
      reversalDays: DEACTIVATION_REVERSAL_DAYS,
    };
  }

  /** Reverse a self-deactivation — reactivates the account and clears the request stamp. */
  async reactivateMe(userId: string, fallbackEmail?: string) {
    const { memberId } = await this.selfLookup.getMyMember(userId, fallbackEmail);
    await this.prisma.$transaction(async (tx) => {
      const returning = await inactiveAmong(tx, this.tenantId, [memberId]);
      await tx.member.update({
        where: { id: memberId },
        data: { status: 'ACTIVE', deactivationRequestedAt: null },
      });
      // Their follow-up goes back to the stage it had before they left.
      await restoreReactivated(tx, this.tenantId, returning, userId);
    });
    return { success: true, status: 'ACTIVE' };
  }
}
