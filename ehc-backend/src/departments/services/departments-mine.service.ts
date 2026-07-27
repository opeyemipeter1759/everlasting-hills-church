import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { DepartmentsSharedService } from './departments-shared.service';
import { DepartmentsScopeService } from './departments-scope.service';
import { DepartmentHodService } from './department-hod.service';

/** Admin Head / HOD scoped read surface: "my departments", "my unit roster". */
@Injectable()
export class DepartmentsMineService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly shared: DepartmentsSharedService,
    private readonly scope: DepartmentsScopeService,
    private readonly hods: DepartmentHodService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getMine(actor: AuthUser) {
    const [deptIds, headDeptIds] = await Promise.all([
      this.scope.myActiveDeptIds(actor),
      this.scope.myHeadDeptIds(actor),
    ]);
    if (!deptIds.length) return { departments: [] };
    const headSet = new Set(headDeptIds);
    const memberSelect = { id: true, firstName: true, lastName: true, photoUrl: true };
    const [departments, memberCounts, hodsByDept] = await Promise.all([
      this.prisma.department.findMany({
        where: { tenantId: this.tenantId, id: { in: deptIds } },
        orderBy: { sortOrder: 'asc' },
        include: {
          Units: {
            include: {
              UnitMember: { where: { isLead: true }, include: { Member: { select: memberSelect } } },
              _count: { select: { UnitMember: true } },
            },
            orderBy: { name: 'asc' },
          },
        },
      }),
      this.shared.deptMemberCounts(),
      Promise.all(deptIds.map(async (id) => [id, await this.hods.listHods(id)] as const)),
    ]);
    const hodMap = new Map(hodsByDept);
    return {
      departments: departments.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        description: d.description,
        memberCount: memberCounts.get(d.id) ?? 0,
        // "ADMIN_HEAD" if the actor fully heads this department, else they're
        // reaching it as an HOD (scoped to appointing unit leads only).
        myRole: headSet.has(d.id) ? 'ADMIN_HEAD' : 'HOD',
        hods: hodMap.get(d.id) ?? [],
        units: d.Units.map((u) => ({
          id: u.id,
          name: u.name,
          memberCount: u._count.UnitMember,
          lead: u.UnitMember[0]?.Member ?? null,
        })),
      })),
    };
  }

  async getMyUnitRoster(actor: AuthUser, unitId: string) {
    const unitIds = await this.scope.myUnitIds(actor);
    if (!unitIds.has(unitId)) {
      throw new ForbiddenException('This unit is not in your department');
    }
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, tenantId: this.tenantId },
      include: {
        UnitMember: {
          include: { Member: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, photoUrl: true, status: true } } },
          orderBy: [{ isLead: 'desc' }, { isAssistant: 'desc' }, { joinedAt: 'asc' }],
        },
      },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    return {
      id: unit.id,
      name: unit.name,
      members: unit.UnitMember.map((um) => ({
        memberId: um.memberId,
        isLead: um.isLead,
        isAssistant: um.isAssistant,
        Member: um.Member,
      })),
    };
  }
}
