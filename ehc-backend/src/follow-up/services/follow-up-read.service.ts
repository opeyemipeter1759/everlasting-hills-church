import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FollowUpStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { ENTRY_INCLUDE } from '../follow-up.types';
import { FollowUpAuthService } from './follow-up-auth.service';
import { FollowUpEntryMapperService } from './follow-up-entry-mapper.service';
import { FollowUpAbsenteeDetailService } from './follow-up-absentee-detail.service';

/**
 * Visibility is intentionally church-wide: every authenticated unit member sees
 * the same Master List, the same totals, and the same contact logs — including
 * entries still awaiting review. The only thing that stays restricted is who can
 * *act* (assign, log, mark ready, confirm/reject), enforced per-entry via
 * canLead/canWork and surfaced as viewerCanApprove/viewerCanWork.
 */
@Injectable()
export class FollowUpReadService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: FollowUpAuthService,
    private readonly mapper: FollowUpEntryMapperService,
    private readonly absenteeDetail: FollowUpAbsenteeDetailService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async list(actor: AuthUser, opts: { unitId?: string; stage?: FollowUpStage; mine?: boolean; serviceId?: string }) {
    if (!(await this.auth.hasUnitAccess(actor))) {
      throw new ForbiddenException('You need to be part of a team to view the Follow-Up pipeline');
    }

    const entries = await this.prisma.followUpEntry.findMany({
      where: {
        tenantId: this.tenantId,
        ...(opts.unitId ? { unitId: opts.unitId } : {}),
        ...(opts.stage ? { stage: opts.stage } : {}),
        ...(opts.mine && actor.memberId ? { assigneeId: actor.memberId } : {}),
        // A first-timer entry belongs to the service its Visitor row was tagged
        // with at intake; an absentee entry belongs to a service when that
        // member has no PRESENT attendance record for it (works regardless of
        // when the entry itself was created).
        ...(opts.serviceId
          ? {
              OR: [
                { sourceType: 'FIRST_TIMER' as const, Visitor: { serviceId: opts.serviceId } },
                {
                  sourceType: 'ABSENTEE' as const,
                  Member: { AttendanceRecord: { none: { serviceId: opts.serviceId, present: true } } },
                },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: ENTRY_INCLUDE,
    });
    return this.absenteeDetail.attach(entries.map((e) => this.mapper.mapEntry(e, actor)));
  }

  /** Recent services, for the Follow-Up page's service-day filter. */
  async listServices() {
    return this.prisma.service.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { scheduledAt: 'desc' },
      take: 30,
      select: { id: true, name: true, scheduledAt: true, serviceType: true },
    });
  }

  async getOne(actor: AuthUser, id: string) {
    if (!(await this.auth.hasUnitAccess(actor))) {
      throw new ForbiddenException('You need to be part of a team to view the Follow-Up pipeline');
    }

    const entry = await this.prisma.followUpEntry.findFirst({
      where: { id, tenantId: this.tenantId },
      include: ENTRY_INCLUDE,
    });
    if (!entry) throw new NotFoundException('Follow-up entry not found');
    const [detailed] = await this.absenteeDetail.attach([this.mapper.mapEntry(entry, actor)]);
    return detailed;
  }
}
