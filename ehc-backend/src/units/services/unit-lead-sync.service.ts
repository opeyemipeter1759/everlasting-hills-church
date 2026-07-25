import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { EffectiveRolesService } from '../../auth/effective-roles.service';

/**
 * Keeps UnitLeadAssignment (the real source of the UNIT_LEAD effective role — see
 * EffectiveRolesService) in sync with the denormalized UnitMember.isLead flag.
 * Shared by unit-member assignment and role-change call sites.
 */
@Injectable()
export class UnitLeadSyncService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly effectiveRoles: EffectiveRolesService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async syncUnitLeadAssignment(actor: AuthUser, unitId: string, profileId: string, isLead: boolean) {
    const current = await this.prisma.unitLeadAssignment.findFirst({
      where: { tenantId: this.tenantId, unitId, endedAt: null },
    });

    if (isLead) {
      if (current?.userId === profileId) return; // already the active lead
      if (current) {
        await this.prisma.unitLeadAssignment.update({ where: { id: current.id }, data: { endedAt: new Date() } });
        this.effectiveRoles.invalidate(current.userId);
      }
      await this.prisma.unitLeadAssignment.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          unitId,
          userId: profileId,
          assignedById: actor.profileId ?? null,
        },
      });
      this.effectiveRoles.invalidate(profileId);
    } else if (current?.userId === profileId) {
      await this.prisma.unitLeadAssignment.update({ where: { id: current.id }, data: { endedAt: new Date() } });
      this.effectiveRoles.invalidate(profileId);
    }
  }
}
