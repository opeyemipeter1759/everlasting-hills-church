import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FollowUpStage, MemberStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { PipelineRepository } from '../../pipeline/pipeline.repository';
import type { PipelineRow } from '../../pipeline/pipeline.types';
import { ADMIN_PLUS } from '../follow-up.types';
import { entryForVisitor, setStage, stageBeforeOptOut } from '../stage-transitions';
import { FollowUpAuthService } from './follow-up-auth.service';

/** What the viewer may do to one first-timer's follow-up, so the profile only offers what will work. */
export interface FollowUpActions {
  canReassign: boolean;
  canOptOut: boolean;
  canRestore: boolean;
  canArchive: boolean;
  /** Why Restore is not offered when the person is opted out, in plain words. */
  restoreBlockedBy: string | null;
}

const DEACTIVATED = 'Their account is deactivated. Reactivate it from People and their follow-up comes back on its own.';

/**
 * Opting a first-timer out of follow-up, and restoring them. Statuses are not
 * set by hand any more (visits and approvals set them); opting out is the one
 * manual move, and restoring puts back the stage they had before it.
 *
 * The lead of the unit their follow-up sits under decides, or that unit's
 * department head, or anyone church-wide.
 */
@Injectable()
export class FollowUpStageService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: PipelineRepository,
    private readonly auth: FollowUpAuthService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async actions(actor: AuthUser, visitorId: string): Promise<FollowUpActions> {
    await this.auth.requireAccess(actor);
    const { entry, accountActive } = await this.load(visitorId);
    const canLead = entry ? await this.auth.canLeadUnit(actor, entry.unitId) : false;
    const optedOut = entry?.stage === FollowUpStage.OPTED_OUT;
    return {
      canReassign: canLead && !optedOut && accountActive,
      canOptOut: canLead && !optedOut,
      canRestore: canLead && optedOut && accountActive,
      canArchive: actor.effectiveRoles.some((r) => ADMIN_PLUS.includes(r)),
      restoreBlockedBy: optedOut && !accountActive ? DEACTIVATED : null,
    };
  }

  async optOut(actor: AuthUser, visitorId: string): Promise<PipelineRow> {
    const { entry } = await this.authorised(actor, visitorId);
    if (entry.stage === FollowUpStage.OPTED_OUT) throw new ConflictException('They are already opted out');
    await this.prisma.$transaction((tx) =>
      setStage(tx, { tenantId: this.tenantId, entryId: entry.id, to: FollowUpStage.OPTED_OUT, reason: 'OPTED_OUT', actorId: actor.profileId }),
    );
    return this.row(visitorId);
  }

  async restore(actor: AuthUser, visitorId: string): Promise<PipelineRow> {
    const { entry, accountActive } = await this.authorised(actor, visitorId);
    if (entry.stage !== FollowUpStage.OPTED_OUT) throw new ConflictException('They are not opted out');
    if (!accountActive) throw new ConflictException(DEACTIVATED);
    await this.prisma.$transaction(async (tx) => {
      const to = await stageBeforeOptOut(tx, entry.id);
      await setStage(tx, { tenantId: this.tenantId, entryId: entry.id, to, reason: 'RESTORED', actorId: actor.profileId });
    });
    return this.row(visitorId);
  }

  /** The person's follow-up entry and whether their account (if any) is active. 404 when they are not on record. */
  private async load(visitorId: string) {
    // The pipeline is tenant-scoped and leaves out archived forms, so finding them there is the check.
    const person = await this.pipeline.one(visitorId);
    if (!person) throw new NotFoundException('First-timer not found');
    const [entry, member] = await Promise.all([
      entryForVisitor(this.prisma, visitorId),
      person.memberId ? this.prisma.member.findUnique({ where: { id: person.memberId }, select: { status: true } }) : null,
    ]);
    return { entry, accountActive: !member || member.status === MemberStatus.ACTIVE };
  }

  private async authorised(actor: AuthUser, visitorId: string) {
    const { entry, accountActive } = await this.load(visitorId);
    if (!entry) throw new ConflictException('They have no follow-up record yet');
    if (!(await this.auth.canLeadUnit(actor, entry.unitId))) {
      throw new ForbiddenException("Only the lead of their follow-up unit, its department head or an admin can do this");
    }
    return { entry, accountActive };
  }

  private async row(visitorId: string): Promise<PipelineRow> {
    const row = await this.pipeline.one(visitorId);
    if (!row) throw new NotFoundException('First-timer not found');
    return row;
  }
}
