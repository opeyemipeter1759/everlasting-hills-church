import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemberStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { EffectiveRolesService } from '../../auth/effective-roles.service';
import type { BulkMemberOpInput } from '../members.types';
import { leaveServiceTeams } from '../leave-service-teams';
import { inactiveAmong, optOutDeactivated, restoreReactivated } from '../../follow-up/deactivation-stage';

/** Tag and bulk status/tag mutations on member rows. */
@Injectable()
export class MemberBulkOpsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly effectiveRoles: EffectiveRolesService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Replace a member's tags. */
  async setTags(memberId: string, tags: string[]) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Member not found');
    const normalized = Array.from(
      new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean)),
    );
    return this.prisma.member.update({
      where: { id: memberId },
      data: { tags: normalized },
      select: { id: true, tags: true },
    });
  }

  /** Bulk status / tag operations on a set of member ids. */
  async bulkMemberOp(input: BulkMemberOpInput, actorId: string | null = null) {
    const ids = input.ids ?? [];
    if (ids.length === 0) return { updated: 0 };

    if (input.op === 'status') {
      const status = (input.value ?? '').toUpperCase();
      if (status !== MemberStatus.ACTIVE && status !== MemberStatus.INACTIVE) {
        throw new BadRequestException('Invalid status');
      }
      const { count, leadsEnded } = await this.prisma.$transaction(async (tx) => {
        const returning = status === MemberStatus.ACTIVE ? await inactiveAmong(tx, this.tenantId, ids) : [];
        const res = await tx.member.updateMany({
          where: { id: { in: ids }, tenantId: this.tenantId },
          data: { status, deactivationRequestedAt: null },
        });
        // Deactivating someone takes them off every service team.
        const ended = status === MemberStatus.ACTIVE ? [] : await leaveServiceTeams(tx, this.tenantId, ids, actorId);
        // Their follow-up records move with the accounts, in this same transaction.
        if (status === MemberStatus.ACTIVE) await restoreReactivated(tx, this.tenantId, returning, actorId);
        else await optOutDeactivated(tx, this.tenantId, ids, actorId);
        return { count: res.count, leadsEnded: ended };
      });
      leadsEnded.forEach((profileId) => this.effectiveRoles.invalidate(profileId));
      return { updated: count };
    }

    if (input.op === 'addTag' || input.op === 'removeTag') {
      const tag = (input.value ?? '').trim().toLowerCase();
      if (!tag) throw new BadRequestException('Tag required');
      const members = await this.prisma.member.findMany({
        where: { id: { in: ids }, tenantId: this.tenantId },
        select: { id: true, tags: true },
      });
      await Promise.all(
        members.map((m) => {
          const next =
            input.op === 'addTag'
              ? Array.from(new Set([...m.tags, tag]))
              : m.tags.filter((t) => t !== tag);
          return this.prisma.member.update({ where: { id: m.id }, data: { tags: next } });
        }),
      );
      return { updated: members.length };
    }

    throw new BadRequestException('Unknown bulk operation');
  }
}
