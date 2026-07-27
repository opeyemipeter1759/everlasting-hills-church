import { Prisma, Role } from '@prisma/client';
import type { DirectoryRow } from './members.types';

/** Translate a requested effective role into a Profile relation filter. */
export function roleFilter(role: Role): Prisma.ProfileWhereInput {
  switch (role) {
    case Role.PASTOR:
    case Role.SUPER_ADMIN:
      return { RoleGrantOf: { some: { role, endedAt: null } } };
    case Role.ADMIN:
    case Role.ADMIN_HEAD:
      // ADMIN merged into ADMIN_HEAD (same level) — match either grant, or an
      // active DepartmentHead row (department-scoped admin heads).
      return {
        OR: [
          { RoleGrantOf: { some: { role: Role.ADMIN_HEAD, endedAt: null } } },
          { RoleGrantOf: { some: { role: Role.ADMIN, endedAt: null } } },
          { DepartmentHeadOf: { some: { endedAt: null } } },
        ],
      };
    case Role.HOD:
      return { DepartmentHodOf: { some: { endedAt: null } } };
    case Role.UNIT_LEAD:
      return { UnitLeadOf: { some: { endedAt: null } } };
    case Role.HEAD_USHER:
      return { HeadUsherOf: { some: { endedAt: null } } };
    case Role.MEMBER:
    default:
      // Plain members: no active grant or assignment of any kind.
      return {
        RoleGrantOf: { none: { endedAt: null } },
        UnitLeadOf: { none: { endedAt: null } },
        DepartmentHeadOf: { none: { endedAt: null } },
        DepartmentHodOf: { none: { endedAt: null } },
        HeadUsherOf: { none: { endedAt: null } },
      };
  }
}

export function directoryOrderBy(
  sortBy?: string,
  sortOrder?: string,
): Prisma.MemberOrderByWithRelationInput {
  const dir = sortOrder === 'asc' ? 'asc' : 'desc';
  switch (sortBy) {
    case 'name':
      return { firstName: dir };
    case 'status':
      return { status: dir };
    // 'role' is effective (grants + assignments), not a column, so it cannot be
    // sorted in the query; fall back to a stable order.
    case 'joinedAt':
    default:
      return { joinedAt: dir };
  }
}

/** Shape a raw directory row (with its resolved effective role) into the API response row. */
export function toPersonRow(r: DirectoryRow, roleMap?: Map<string, Role>) {
  return {
    id: r.id,
    profileId: r.Profile?.id ?? null,
    userId: r.Profile?.userId ?? null,
    firstName: r.firstName,
    lastName: r.lastName,
    name: `${r.firstName} ${r.lastName}`.trim(),
    email: r.email,
    phone: r.phone,
    gender: r.gender,
    photoUrl: r.photoUrl,
    role: (r.Profile?.id ? roleMap?.get(r.Profile.id) : undefined) ?? 'MEMBER',
    status: r.status,
    tags: r.tags ?? [],
    dateOfBirth: r.dateOfBirth ? r.dateOfBirth.toISOString() : null,
    address: r.address,
    joinedAt: r.joinedAt.toISOString(),
    attendanceCount: r._count.AttendanceRecord,
    engagementScore: r.EngagementScore?.score ?? 0,
    units: r.UnitMember.map((um) => ({
      id: um.Unit.id,
      name: um.Unit.name,
      isLead: um.isLead,
      isAssistant: um.isAssistant,
    })),
    shepherdedBy: r.CareAsMember.map((c) => ({
      assignmentId: c.id,
      leaderId: c.leaderId,
      leaderName: `${c.Leader.firstName} ${c.Leader.lastName}`.trim(),
    })),
  };
}
