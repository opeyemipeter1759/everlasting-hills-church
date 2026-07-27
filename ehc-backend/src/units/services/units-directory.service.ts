import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { EffectiveRolesService } from '../../auth/effective-roles.service';

@Injectable()
export class UnitsDirectoryService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly effectiveRoles: EffectiveRolesService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * Returns all units (with lead + assistant) and all named leaders:
   * UNIT_LEAD, ADMIN, PASTOR, SUPER_ADMIN.
   */
  async getDirectory() {
    const [units, profiles] = await Promise.all([
      this.prisma.unit.findMany({
        where: { tenantId: this.tenantId },
        include: {
          UnitMember: {
            where: { OR: [{ isLead: true }, { isAssistant: true }] },
            include: {
              Member: {
                select: { id: true, firstName: true, lastName: true, email: true, phone: true, photoUrl: true },
              },
            },
          },
          _count: { select: { UnitMember: true } },
        },
        orderBy: { name: 'asc' },
      }),
      // Leaders = anyone with an active grant or unit-lead / department-head
      // assignment (the new source of truth), not the legacy role column.
      this.prisma.profile.findMany({
        where: {
          tenantId: this.tenantId,
          OR: [
            { RoleGrantOf: { some: { endedAt: null } } },
            { UnitLeadOf: { some: { endedAt: null } } },
            { DepartmentHeadOf: { some: { endedAt: null } } },
          ],
        },
        include: {
          Member: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true, photoUrl: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const roleMap = await this.effectiveRoles.getEffectiveRolesBatch(profiles.map((p) => p.id));

    return {
      units: units.map((u) => ({
        id: u.id,
        name: u.name,
        description: u.description,
        totalMembers: u._count.UnitMember,
        lead: u.UnitMember.find((m) => m.isLead)?.Member ?? null,
        assistant: u.UnitMember.find((m) => m.isAssistant)?.Member ?? null,
      })),
      leadership: profiles.map((p) => ({
        profileId: p.id,
        role: roleMap.get(p.id)?.primaryRole ?? Role.MEMBER,
        member: p.Member
          ? {
              id: p.Member.id,
              firstName: p.Member.firstName,
              lastName: p.Member.lastName,
              email: p.Member.email,
              phone: p.Member.phone,
              photoUrl: p.Member.photoUrl,
            }
          : null,
      })),
    };
  }
}
