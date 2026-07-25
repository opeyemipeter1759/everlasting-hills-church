import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { MANAGE_ROLES } from '../departments.util';

/** Resolves which departments/units an Admin Head or HOD is scoped to. */
@Injectable()
export class DepartmentsScopeService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * Department ids the actor leads in any capacity — either as the full Admin
   * Head (DepartmentHead) or as an HOD (DepartmentHod). Both endedAt IS NULL.
   */
  async myActiveDeptIds(actor: AuthUser): Promise<string[]> {
    if (!actor.profileId) return [];
    const [heads, hods] = await Promise.all([
      this.prisma.departmentHead.findMany({
        where: { tenantId: this.tenantId, userId: actor.profileId, endedAt: null },
        select: { departmentId: true },
      }),
      this.prisma.departmentHod.findMany({
        where: { tenantId: this.tenantId, userId: actor.profileId, endedAt: null },
        select: { departmentId: true },
      }),
    ]);
    return [...new Set([...heads.map((r) => r.departmentId), ...hods.map((r) => r.departmentId)])];
  }

  /** Department ids the actor is currently the full Admin Head of. */
  async myHeadDeptIds(actor: AuthUser): Promise<string[]> {
    if (!actor.profileId) return [];
    const rows = await this.prisma.departmentHead.findMany({
      where: { tenantId: this.tenantId, userId: actor.profileId, endedAt: null },
      select: { departmentId: true },
    });
    return rows.map((r) => r.departmentId);
  }

  /** Admins target any department; an Admin Head only the departments they head. */
  async assertCanAssignHod(actor: AuthUser, deptId: string) {
    if (actor.role && MANAGE_ROLES.includes(actor.role)) return;
    const mine = await this.myHeadDeptIds(actor);
    if (!mine.includes(deptId)) {
      throw new ForbiddenException('This department is not one you head');
    }
  }

  /** Unit ids inside the departments the actor actively heads. */
  async myUnitIds(actor: AuthUser): Promise<Set<string>> {
    const deptIds = await this.myActiveDeptIds(actor);
    if (!deptIds.length) return new Set();
    const units = await this.prisma.unit.findMany({
      where: { tenantId: this.tenantId, departmentId: { in: deptIds } },
      select: { id: true },
    });
    return new Set(units.map((u) => u.id));
  }

  /** Admins target any department; an Admin Head only the departments they head. */
  async assertCanTargetDept(actor: AuthUser, deptId: string) {
    if (actor.role && MANAGE_ROLES.includes(actor.role)) return;
    const mine = await this.myActiveDeptIds(actor);
    if (!mine.includes(deptId)) {
      throw new ForbiddenException('This department is not one you head');
    }
  }
}
