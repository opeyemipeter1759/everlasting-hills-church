import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { MANAGE_ROLES } from '../departments.util';
import { DepartmentsScopeService } from './departments-scope.service';

export interface MyDepartmentUnits {
  department: { id: string; name: string };
  units: { id: string; name: string; isMember: boolean }[];
}

/**
 * The units a person may open, grouped by the department they belong to.
 *
 * This is what a department-led sidebar section needs: an ordinary member sees
 * only the units they are actually in, while the department's Admin Head (or
 * an HOD) sees every unit under the department they lead — without the
 * frontend having to stitch together /units/mine, /units/my-memberships and
 * /departments/mine and still not know which department each unit sits in.
 */
@Injectable()
export class DepartmentsMyUnitsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DepartmentsScopeService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getMine(actor: AuthUser): Promise<MyDepartmentUnits[]> {
    const churchWide = (actor.effectiveRoles ?? []).some((role) => MANAGE_ROLES.includes(role));
    // Departments they head — as full Admin Head or as an HOD — carry every
    // unit inside them, whether or not they serve in those units themselves.
    const ledDeptIds = churchWide ? [] : await this.scope.myActiveDeptIds(actor);

    const where: Prisma.UnitWhereInput = churchWide
      ? { tenantId: this.tenantId }
      : {
          tenantId: this.tenantId,
          OR: [
            ...(actor.memberId ? [{ UnitMember: { some: { memberId: actor.memberId } } }] : []),
            ...(ledDeptIds.length ? [{ departmentId: { in: ledDeptIds } }] : []),
          ],
        };

    // Nothing to match on at all — a member with no unit and no department.
    if (!churchWide && !actor.memberId && ledDeptIds.length === 0) return [];

    const units = await this.prisma.unit.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        Department: { select: { id: true, name: true, sortOrder: true } },
        UnitMember: actor.memberId
          ? { where: { memberId: actor.memberId }, select: { id: true }, take: 1 }
          : false,
      },
    });

    const byDepartment = new Map<string, MyDepartmentUnits & { sortOrder: number }>();
    for (const unit of units) {
      // A unit with no department has no section to appear under.
      if (!unit.Department) continue;
      const existing = byDepartment.get(unit.Department.id) ?? {
        department: { id: unit.Department.id, name: unit.Department.name },
        units: [],
        sortOrder: unit.Department.sortOrder ?? 0,
      };
      existing.units.push({
        id: unit.id,
        name: unit.name,
        isMember: Array.isArray(unit.UnitMember) && unit.UnitMember.length > 0,
      });
      byDepartment.set(unit.Department.id, existing);
    }

    return [...byDepartment.values()]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.department.name.localeCompare(b.department.name))
      .map(({ department, units: unitList }) => ({ department, units: unitList }));
  }
}
