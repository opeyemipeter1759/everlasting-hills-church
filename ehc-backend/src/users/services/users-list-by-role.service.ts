import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { EffectiveRolesService } from '../../auth/effective-roles.service';

/**
 * Returns all members grouped by role.
 * - SUPER_ADMIN / PASTOR / ADMIN / UNIT_LEAD / MEMBER come from Profile + Member.
 * - VISITOR comes from the Visitor table (form submissions — no auth account),
 *   excluding rows that have already converted to a Member (convertedAt set).
 * - UNIT_LEAD entries include which units they lead or assist.
 */
@Injectable()
export class UsersListByRoleService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly effectiveRoles: EffectiveRolesService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async listByRole() {
    const [profiles, visitors] = await Promise.all([
      this.prisma.profile.findMany({
        where: { tenantId: this.tenantId },
        include: {
          Member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              photoUrl: true,
              status: true,
              joinedAt: true,
              UnitMember: {
                where: { OR: [{ isLead: true }, { isAssistant: true }] },
                include: { Unit: { select: { id: true, name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.visitor.findMany({
        where: { tenantId: this.tenantId, convertedAt: null },
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          submittedAt: true,
        },
      }),
    ]);

    // Group each profile under its highest effective role (from grants + assignments).
    // ADMIN merges into ADMIN_HEAD (same level) — no separate ADMIN bucket.
    const effByProfile = await this.effectiveRoles.getEffectiveRolesBatch(profiles.map((p) => p.id));
    const grouped: Record<string, unknown[]> = {
      [Role.SUPER_ADMIN]: [],
      [Role.PASTOR]: [],
      [Role.ADMIN_HEAD]: [],
      [Role.HOD]: [],
      [Role.HEAD_USHER]: [],
      [Role.UNIT_LEAD]: [],
      [Role.MEMBER]: [],
      VISITOR: [],
    };

    for (const p of profiles) {
      const eff = effByProfile.get(p.id);
      const primaryRole = eff?.primaryRole ?? Role.MEMBER;
      const role = primaryRole === Role.ADMIN ? Role.ADMIN_HEAD : primaryRole;

      // Every role held, not just the highest. Filing somebody under one role
      // made this list contradict the counts above it on the same screen: a
      // church admin who also heads a department was counted as a head of
      // department and listed only as an admin, so the card read 3 and the
      // column showed 1. Multi role is real here and the page should say so.
      const heldRoles = new Set<string>(
        (eff?.roles ?? [Role.MEMBER]).map((r) => (r === Role.ADMIN ? Role.ADMIN_HEAD : r)),
      );
      const member = p.Member
        ? {
            id: p.Member.id,
            firstName: p.Member.firstName,
            lastName: p.Member.lastName,
            email: p.Member.email,
            phone: p.Member.phone,
            photoUrl: p.Member.photoUrl,
            status: p.Member.status,
            joinedAt: p.Member.joinedAt,
            roles: eff?.roles ?? [Role.MEMBER],
            ...(role === Role.UNIT_LEAD && {
              units: p.Member.UnitMember.map((um) => ({
                unitId: um.Unit.id,
                unitName: um.Unit.name,
                isLead: um.isLead,
                isAssistant: um.isAssistant,
              })),
            }),
          }
        : null;

      const entry = {
        profileId: p.id,
        userId: p.userId,
        role,
        roles: eff?.roles ?? [Role.MEMBER],
        member,
      };
      for (const held of heldRoles) {
        if (grouped[held]) grouped[held].push(entry);
      }
      // Everyone with a profile counts as a member, which is what the Member
      // card counts, so the two agree.
      if (!heldRoles.has(Role.MEMBER)) grouped[Role.MEMBER].push(entry);
    }

    grouped['VISITOR'] = visitors.map((v) => ({
      id: v.id,
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      phone: v.phone,
      submittedAt: v.submittedAt,
    }));

    return grouped;
  }
}
