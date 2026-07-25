import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

/**
 * Returns every role with its display label, level, and count.
 *  ADMIN merged into ADMIN_HEAD (same level) — one combined row, counting the
 *  distinct union of legacy ADMIN grants, ADMIN_HEAD grants, and active
 *  DepartmentHead rows, so no one is double-counted across the two paths.
 *  Visitors are counted from the Visitor table (form submissions) that haven't
 *  converted to a Member yet — once convertedAt is set, that person is a
 *  Member (and counts there instead), not still a Visitor.
 *  All other roles are counted from the Profile table.
 */
@Injectable()
export class UsersRolesOverviewService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getAllRoles() {
    // Counts come from grants + active assignments (the new source of truth), not
    // the legacy column. MEMBER is the universal base = every profile.
    const t = this.tenantId;
    const [totalProfiles, grantRows, unitLeads, deptHeads, deptHods, ushers, visitorCount] = await Promise.all([
      this.prisma.profile.count({ where: { tenantId: t } }),
      this.prisma.roleGrant.findMany({ where: { tenantId: t, endedAt: null }, select: { userId: true, role: true } }),
      this.prisma.unitLeadAssignment.findMany({ where: { tenantId: t, endedAt: null }, select: { userId: true }, distinct: ['userId'] }),
      this.prisma.departmentHead.findMany({ where: { tenantId: t, endedAt: null }, select: { userId: true }, distinct: ['userId'] }),
      this.prisma.departmentHod.findMany({ where: { tenantId: t, endedAt: null }, select: { userId: true }, distinct: ['userId'] }),
      this.prisma.headUsherAssignment.findMany({ where: { tenantId: t, endedAt: null }, select: { userId: true }, distinct: ['userId'] }),
      this.prisma.visitor.count({ where: { tenantId: t, convertedAt: null } }),
    ]);

    const distinctGrantCount = (role: Role) =>
      new Set(grantRows.filter((g) => g.role === role).map((g) => g.userId)).size;
    const adminHeadUserIds = new Set<string>([
      ...grantRows.filter((g) => g.role === Role.ADMIN || g.role === Role.ADMIN_HEAD).map((g) => g.userId),
      ...deptHeads.map((d) => d.userId),
    ]);
    const countMap: Record<string, number> = {
      [Role.SUPER_ADMIN]: distinctGrantCount(Role.SUPER_ADMIN),
      [Role.PASTOR]: distinctGrantCount(Role.PASTOR),
      [Role.ADMIN_HEAD]: adminHeadUserIds.size,
      [Role.HOD]: deptHods.length,
      [Role.HEAD_USHER]: ushers.length,
      [Role.UNIT_LEAD]: unitLeads.length,
      [Role.MEMBER]: totalProfiles,
    };

    return [
      { role: Role.SUPER_ADMIN, label: 'Super Admin', level: 8, count: countMap[Role.SUPER_ADMIN] ?? 0 },
      { role: Role.PASTOR,      label: 'Pastor',      level: 7, count: countMap[Role.PASTOR]      ?? 0 },
      { role: Role.ADMIN_HEAD,  label: 'Admin Head',  level: 6, count: countMap[Role.ADMIN_HEAD]  ?? 0 },
      { role: Role.HOD,         label: 'Head of Department', level: 4, count: countMap[Role.HOD]  ?? 0 },
      { role: Role.HEAD_USHER,  label: 'Head Usher',  level: 3, count: countMap[Role.HEAD_USHER]  ?? 0 },
      { role: Role.UNIT_LEAD,   label: 'Unit Leader', level: 2, count: countMap[Role.UNIT_LEAD]   ?? 0 },
      { role: Role.MEMBER,      label: 'Member',      level: 1, count: countMap[Role.MEMBER]       ?? 0 },
      { role: 'VISITOR',        label: 'Visitor',     level: 0, count: visitorCount },
    ];
  }
}
