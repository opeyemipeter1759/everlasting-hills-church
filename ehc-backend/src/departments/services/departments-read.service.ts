import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { personLabel } from '../departments.util';
import { DepartmentsSharedService } from './departments-shared.service';
import { DepartmentHodService } from './department-hod.service';

@Injectable()
export class DepartmentsReadService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly shared: DepartmentsSharedService,
    private readonly hods: DepartmentHodService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private async activeHeadsByDept() {
    const rows = await this.prisma.departmentHead.findMany({
      where: { tenantId: this.tenantId, endedAt: null },
      include: { User: { select: { id: true, Member: { select: { firstName: true, lastName: true, photoUrl: true } } } } },
    });
    const map = new Map<string, ReturnType<typeof personLabel>>();
    for (const r of rows) map.set(r.departmentId, personLabel(r.User));
    return map;
  }

  async list() {
    const [departments, unassignedUnits, memberCounts, activeHeads] = await Promise.all([
      this.prisma.department.findMany({
        where: { tenantId: this.tenantId },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { Units: true } } },
      }),
      this.prisma.unit.findMany({
        where: { tenantId: this.tenantId, departmentId: null },
        include: { _count: { select: { UnitMember: true } } },
        orderBy: { name: 'asc' },
      }),
      this.shared.deptMemberCounts(),
      this.activeHeadsByDept(),
    ]);

    return {
      departments: departments.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        description: d.description,
        sortOrder: d.sortOrder,
        unitCount: d._count.Units,
        memberCount: memberCounts.get(d.id) ?? 0,
        head: activeHeads.get(d.id) ?? null,
      })),
      unassignedUnits: unassignedUnits.map((u) => ({
        id: u.id,
        name: u.name,
        memberCount: u._count.UnitMember,
      })),
    };
  }

  async getOne(id: string) {
    const dept = await this.shared.deptOrThrow(id);
    const memberSelect = { id: true, firstName: true, lastName: true, email: true, photoUrl: true, status: true };
    const [units, heads, hods, memberCounts] = await Promise.all([
      this.prisma.unit.findMany({
        where: { tenantId: this.tenantId, departmentId: id },
        include: {
          UnitMember: { where: { isLead: true }, include: { Member: { select: memberSelect } } },
          _count: { select: { UnitMember: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.departmentHead.findMany({
        where: { tenantId: this.tenantId, departmentId: id },
        orderBy: { assignedAt: 'desc' },
        include: {
          User: { select: { id: true, Member: { select: { firstName: true, lastName: true, photoUrl: true } } } },
          AssignedBy: { select: { id: true, Member: { select: { firstName: true, lastName: true, photoUrl: true } } } },
        },
      }),
      this.hods.listHods(id),
      this.shared.deptMemberCounts(),
    ]);

    const current = heads.find((h) => h.endedAt === null) ?? null;
    return {
      department: {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        description: dept.description,
        sortOrder: dept.sortOrder,
      },
      memberCount: memberCounts.get(id) ?? 0,
      currentHead: current ? { ...personLabel(current.User), assignedAt: current.assignedAt.toISOString() } : null,
      hods,
      units: units.map((u) => ({
        id: u.id,
        name: u.name,
        memberCount: u._count.UnitMember,
        lead: u.UnitMember[0]?.Member ?? null,
      })),
      history: heads.map((h) => ({
        id: h.id,
        assignedAt: h.assignedAt.toISOString(),
        endedAt: h.endedAt ? h.endedAt.toISOString() : null,
        user: personLabel(h.User),
        assignedBy: h.AssignedBy ? personLabel(h.AssignedBy) : null,
      })),
    };
  }
}
