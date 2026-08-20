import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../auth/types/auth-user';
import { UnitsMembershipService } from './units-membership.service';
import { UnitsCrudService } from './units-crud.service';

@Injectable()
export class UnitsSelfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: UnitsMembershipService,
    private readonly crud: UnitsCrudService,
  ) {}

  async findMyUnit(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { Member: { select: { id: true } } },
    });
    if (!profile?.Member) return null;

    const membership = await this.prisma.unitMember.findFirst({
      where: {
        memberId: profile.Member.id,
        OR: [{ isLead: true }, { isAssistant: true }],
      },
      include: {
        Unit: { include: { _count: { select: { UnitMember: true } } } },
      },
    });
    if (!membership) return null;

    return {
      id: membership.Unit.id,
      name: membership.Unit.name,
      description: membership.Unit.description,
      totalMembers: membership.Unit._count.UnitMember,
      isLead: membership.isLead,
      isAssistant: membership.isAssistant,
    };
  }

  /** All units the current user leads or assists (unlike findMyUnit, not just the first one). */
  async findMyUnits(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { Member: { select: { id: true } } },
    });
    if (!profile?.Member) return [];

    const memberships = await this.prisma.unitMember.findMany({
      where: {
        memberId: profile.Member.id,
        OR: [{ isLead: true }, { isAssistant: true }],
      },
      include: {
        Unit: { include: { _count: { select: { UnitMember: true } } } },
      },
      orderBy: { Unit: { name: 'asc' } },
    });

    return memberships.map((m) => ({
      id: m.Unit.id,
      name: m.Unit.name,
      description: m.Unit.description,
      totalMembers: m.Unit._count.UnitMember,
      isLead: m.isLead,
      isAssistant: m.isAssistant,
    }));
  }

  /**
   * Full unit detail (member list with roles/positions), self-scoped: only for a
   * unit the caller actually leads or assists (or ADMIN+). Fixes the gap where
   * `GET /units/:unitId` is ADMIN-only and a plain UNIT_LEAD can't fetch their own
   * unit's detail.
   */
  async findMyUnitDetail(actor: AuthUser, unitId: string) {
    await this.membership.assertCanManageUnit(actor, unitId);
    return this.crud.getById(unitId);
  }

  /**
   * Units the current user is a plain member of — deliberately excludes units
   * they lead/assist (those surface separately via findMyUnits, for the "My
   * Unit" management view). Backs the "Unit" nav item in the Member section.
   */
  async findMyMemberships(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { Member: { select: { id: true } } },
    });
    if (!profile?.Member) return [];

    const memberships = await this.prisma.unitMember.findMany({
      where: {
        memberId: profile.Member.id,
        isLead: false,
        isAssistant: false,
      },
      include: {
        Unit: { include: { _count: { select: { UnitMember: true } } } },
      },
      orderBy: { Unit: { name: 'asc' } },
    });

    return memberships.map((m) => ({
      id: m.Unit.id,
      name: m.Unit.name,
      description: m.Unit.description,
      totalMembers: m.Unit._count.UnitMember,
      isLead: m.isLead,
      isAssistant: m.isAssistant,
    }));
  }

  /** Full unit detail for a plain member (or lead/assistant/ADMIN+) of that unit. */
  async findMyMembershipDetail(actor: AuthUser, unitId: string) {
    await this.membership.assertIsUnitMember(actor, unitId);
    return this.crud.getById(unitId);
  }
}
