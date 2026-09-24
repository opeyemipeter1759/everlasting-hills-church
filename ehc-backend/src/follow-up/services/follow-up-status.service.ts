import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import type { MasterListStatus } from './master-list.util';
import { FollowUpAuthService } from './follow-up-auth.service';
import { latestStatusByPerson, type AgreedStatus } from './status-override.util';

const CHURCH_WIDE: Role[] = [Role.ADMIN, Role.ADMIN_HEAD, Role.PASTOR, Role.SUPER_ADMIN];

/**
 * Changing how someone reads on the Master List.
 *
 * The status is normally worked out from attendance and follow-up outcomes.
 * When the team knows better, anyone on the team may ask for a different one —
 * but it only counts once a unit lead or head of department approves it. A
 * leader's own change is approved as it is made; asking them to approve
 * themselves would be theatre.
 */
@Injectable()
export class FollowUpStatusService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: FollowUpAuthService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * The Follow Up unit's own lead, the head of department over it, or anyone
   * church-wide. Leading some other team is not enough: resolveReportsUnit
   * answers only for the Follow Up unit's lead (and church-wide roles), which
   * is the same test the Report tab uses.
   */
  async canDecide(actor: AuthUser): Promise<boolean> {
    if ((actor.hodOf?.length ?? 0) > 0) return true;
    if (actor.effectiveRoles.some((role) => CHURCH_WIDE.includes(role))) return true;
    return (await this.auth.resolveReportsUnit(actor)) !== null;
  }

  async request(
    actor: AuthUser,
    input: { subjectKind: string; subjectId: string; fromStatus: string; toStatus: string; note?: string },
  ) {
    if (!actor.profileId) throw new ForbiddenException('No profile linked to this account');
    const approvedOnSight = await this.canDecide(actor);

    return this.prisma.followUpStatusChange.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        subjectKind: input.subjectKind,
        subjectId: input.subjectId,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        note: input.note,
        requestedById: actor.profileId,
        state: approvedOnSight ? 'APPROVED' : 'PENDING',
        ...(approvedOnSight && { decidedById: actor.profileId, decidedAt: new Date() }),
      },
    });
  }

  async decide(actor: AuthUser, id: string, approve: boolean) {
    if (!(await this.canDecide(actor))) {
      throw new ForbiddenException('Only a unit lead or head of department can decide this');
    }
    const change = await this.prisma.followUpStatusChange.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!change) throw new NotFoundException('Request not found');

    return this.prisma.followUpStatusChange.update({
      where: { id },
      data: {
        state: approve ? 'APPROVED' : 'REJECTED',
        decidedById: actor.profileId,
        decidedAt: new Date(),
      },
    });
  }

  /** The agreed status for each person who has one — latest approved change wins. */
  async approvedFor(kind: string, ids: string[]): Promise<Map<string, AgreedStatus>> {
    return this.latest(kind, ids, 'APPROVED');
  }

  /** People with a change still waiting on a leader, so the UI can say so. */
  async pendingFor(kind: string, ids: string[]): Promise<Map<string, AgreedStatus>> {
    return this.latest(kind, ids, 'PENDING');
  }

  private latest(kind: string, ids: string[], state: string): Promise<Map<string, AgreedStatus>> {
    return latestStatusByPerson(this.prisma, { tenantId: this.tenantId, kind, ids, state });
  }
}
