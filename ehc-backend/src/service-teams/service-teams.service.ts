import { Injectable } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';

/**
 * The people who serve.
 *
 * The Units screen answers "what teams exist and who is on this one". It cannot
 * answer "who serves in this church, and where", because it is organised by
 * team and a person on three teams appears three times with no way to see that
 * it is one person. This reads the same UnitMember rows the other way round:
 * one row per person, every team they are on gathered onto it.
 *
 * A "service team" is a Unit. The People screen has always called them
 * "Units / service teams" in its own copy; this module uses the name the church
 * uses out loud.
 */
@Injectable()
export class ServiceTeamsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * Everyone on at least one team, with every team they are on.
   *
   * Filtering happens on the membership rows, not on the people: asking for one
   * department should not strip a person's other teams off their row, because
   * serving in two departments is exactly the thing this screen exists to make
   * visible. A person is included when any of their teams matches.
   */
  async roster(query: {
    search?: string;
    departmentId?: string;
    unitId?: string;
    role?: 'LEAD' | 'ASSISTANT' | 'MEMBER';
    status?: MemberStatus;
  }) {
    const [members, units, totalMembers] = await Promise.all([
      this.prisma.member.findMany({
        where: {
          tenantId: this.tenantId,
          UnitMember: { some: this.membershipFilter(query) },
          ...(query.status ? { status: query.status } : {}),
          ...(query.search ? this.searchFilter(query.search) : {}),
        },
        select: {
          id: true,
          profileId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          photoUrl: true,
          status: true,
          joinedAt: true,
          UnitMember: {
            select: {
              id: true,
              isLead: true,
              isAssistant: true,
              joinedAt: true,
              Position: { select: { id: true, name: true } },
              Unit: {
                select: {
                  id: true,
                  name: true,
                  Department: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      this.prisma.unit.findMany({
        where: { tenantId: this.tenantId },
        select: {
          id: true,
          name: true,
          Department: { select: { id: true, name: true } },
          _count: { select: { UnitMember: true } },
          UnitMember: { where: { isLead: true }, select: { id: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.member.count({ where: { tenantId: this.tenantId, status: MemberStatus.ACTIVE } }),
    ]);

    const people = members.map((member) => {
      const teams = member.UnitMember
        // The person is in the result because one team matched. The rest of
        // their teams still belong on the row, but the matched ones are marked
        // so the table can show why they are here.
        .map((um) => ({
          membershipId: um.id,
          unitId: um.Unit.id,
          unitName: um.Unit.name,
          departmentId: um.Unit.Department?.id ?? null,
          departmentName: um.Unit.Department?.name ?? null,
          isLead: um.isLead,
          isAssistant: um.isAssistant,
          positionId: um.Position?.id ?? null,
          positionName: um.Position?.name ?? null,
          joinedAt: um.joinedAt,
          matchesFilter: this.matches(um, query),
        }))
        .sort((a, b) => a.unitName.localeCompare(b.unitName));

      return {
        memberId: member.id,
        profileId: member.profileId,
        firstName: member.firstName,
        lastName: member.lastName,
        name: `${member.firstName} ${member.lastName}`.trim(),
        email: member.email,
        phone: member.phone,
        photoUrl: member.photoUrl,
        status: member.status,
        joinedAt: member.joinedAt,
        teams,
        teamCount: teams.length,
        // Leading anywhere is what makes somebody a leader on this screen, not
        // a role grant: a unit lead who has not been granted UNIT_LEAD yet is
        // still leading a team today.
        leadsCount: teams.filter((t) => t.isLead).length,
      };
    });

    const serving = await this.prisma.member.count({
      where: { tenantId: this.tenantId, UnitMember: { some: {} } },
    });

    return {
      people,
      teams: units.map((unit) => ({
        id: unit.id,
        name: unit.name,
        departmentId: unit.Department?.id ?? null,
        departmentName: unit.Department?.name ?? null,
        memberCount: unit._count.UnitMember,
        hasLead: unit.UnitMember.length > 0,
      })),
      stats: {
        // Everyone serving, church-wide, regardless of the filter above — a
        // filtered count would read as though the church shrank when somebody
        // picks a department.
        serving,
        activeMembers: totalMembers,
        notServing: Math.max(0, totalMembers - serving),
        teamCount: units.length,
        teamsWithoutLead: units.filter((u) => u.UnitMember.length === 0).length,
        servingInMoreThanOne: people.filter((p) => p.teamCount > 1).length,
        matched: people.length,
      },
    };
  }

  /** The predicate applied to a person's memberships, shared by filter and mark. */
  private membershipFilter(query: {
    departmentId?: string;
    unitId?: string;
    role?: 'LEAD' | 'ASSISTANT' | 'MEMBER';
  }) {
    return {
      ...(query.unitId ? { unitId: query.unitId } : {}),
      ...(query.departmentId ? { Unit: { departmentId: query.departmentId } } : {}),
      ...(query.role === 'LEAD' ? { isLead: true } : {}),
      ...(query.role === 'ASSISTANT' ? { isAssistant: true } : {}),
      ...(query.role === 'MEMBER' ? { isLead: false, isAssistant: false } : {}),
    };
  }

  private matches(
    membership: { isLead: boolean; isAssistant: boolean; Unit: { id: string; Department: { id: string } | null } },
    query: { departmentId?: string; unitId?: string; role?: 'LEAD' | 'ASSISTANT' | 'MEMBER' },
  ): boolean {
    if (query.unitId && membership.Unit.id !== query.unitId) return false;
    if (query.departmentId && membership.Unit.Department?.id !== query.departmentId) return false;
    if (query.role === 'LEAD' && !membership.isLead) return false;
    if (query.role === 'ASSISTANT' && !membership.isAssistant) return false;
    if (query.role === 'MEMBER' && (membership.isLead || membership.isAssistant)) return false;
    return true;
  }

  private searchFilter(search: string) {
    const term = search.trim();
    return {
      OR: [
        { firstName: { contains: term, mode: 'insensitive' as const } },
        { lastName: { contains: term, mode: 'insensitive' as const } },
        { email: { contains: term, mode: 'insensitive' as const } },
        { phone: { contains: term, mode: 'insensitive' as const } },
      ],
    };
  }
}
