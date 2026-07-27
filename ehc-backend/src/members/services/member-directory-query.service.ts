import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemberStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { DirectoryQuery } from '../members.types';
import { roleFilter } from '../members-directory.util';

/** Builds the where-clause, ordering, and tenant-wide counts backing the People directory. */
@Injectable()
export class MemberDirectoryQueryService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async buildWhere(q: DirectoryQuery): Promise<Prisma.MemberWhereInput> {
    const where: Prisma.MemberWhereInput = { tenantId: this.tenantId };

    if (q.search) {
      const s = q.search.trim();
      where.OR = [
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
      ];
    }
    if (q.status) where.status = q.status as MemberStatus;
    if (q.gender) where.gender = q.gender.toUpperCase();
    if (q.role) where.Profile = { is: roleFilter(q.role as Role) };
    if (q.unit) where.UnitMember = { some: { unitId: q.unit } };
    if (q.hasUnit === 'true') where.UnitMember = { some: {} };
    if (q.hasUnit === 'false') where.UnitMember = { none: {} };

    if (q.joinedFrom || q.joinedTo) {
      where.joinedAt = {};
      if (q.joinedFrom) where.joinedAt.gte = new Date(q.joinedFrom);
      if (q.joinedTo) where.joinedAt.lte = new Date(`${q.joinedTo}T23:59:59.999Z`);
    }

    // Birth month needs MONTH() extraction Prisma can't express in a filter —
    // resolve matching ids with a raw query, then constrain by id.
    if (q.birthMonth) {
      const month = Number(q.birthMonth);
      if (month >= 1 && month <= 12) {
        const matches = await this.prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM "Member"
          WHERE "tenantId" = ${this.tenantId}
            AND "dateOfBirth" IS NOT NULL
            AND EXTRACT(MONTH FROM "dateOfBirth") = ${month}
        `;
        where.id = { in: matches.map((m) => m.id) };
      }
    }

    return where;
  }

  /** Tenant-wide counts for the stats strip + role chips (unfiltered). */
  async directoryCounts() {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const t = this.tenantId;
    const [grantRows, unitLeads, deptHeads, deptHods, ushers, active, withUnit, thisMonth, total] = await Promise.all([
      this.prisma.roleGrant.findMany({ where: { tenantId: t, endedAt: null }, select: { userId: true, role: true } }),
      this.prisma.unitLeadAssignment.findMany({ where: { tenantId: t, endedAt: null }, select: { userId: true }, distinct: ['userId'] }),
      this.prisma.departmentHead.findMany({ where: { tenantId: t, endedAt: null }, select: { userId: true }, distinct: ['userId'] }),
      this.prisma.departmentHod.findMany({ where: { tenantId: t, endedAt: null }, select: { userId: true }, distinct: ['userId'] }),
      this.prisma.headUsherAssignment.findMany({ where: { tenantId: t, endedAt: null }, select: { userId: true }, distinct: ['userId'] }),
      this.prisma.member.count({ where: { tenantId: t, status: 'ACTIVE' } }),
      this.prisma.member.count({ where: { tenantId: t, UnitMember: { some: {} } } }),
      this.prisma.member.count({ where: { tenantId: t, joinedAt: { gte: monthStart } } }),
      this.prisma.member.count({ where: { tenantId: t } }),
    ]);

    // Counts by effective role (grants + assignments). MEMBER is the base = total.
    // ADMIN merged into ADMIN_HEAD (same level) — one combined, deduplicated count.
    const distinctGrantCount = (role: Role) =>
      new Set(grantRows.filter((g) => g.role === role).map((g) => g.userId)).size;
    const adminHeadUserIds = new Set<string>([
      ...grantRows.filter((g) => g.role === Role.ADMIN || g.role === Role.ADMIN_HEAD).map((g) => g.userId),
      ...deptHeads.map((d) => d.userId),
    ]);
    const byRole: Record<string, number> = {
      SUPER_ADMIN: distinctGrantCount(Role.SUPER_ADMIN),
      PASTOR: distinctGrantCount(Role.PASTOR),
      ADMIN_HEAD: adminHeadUserIds.size,
      HOD: deptHods.length,
      HEAD_USHER: ushers.length,
      UNIT_LEAD: unitLeads.length,
      MEMBER: total,
    };
    return { total, active, withUnit, thisMonth, byRole };
  }
}
