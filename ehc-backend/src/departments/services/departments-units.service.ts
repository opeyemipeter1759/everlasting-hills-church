import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { parseSchema } from '../departments.util';
import { AssignUnitsSchema, CreateUnitInDeptSchema } from '../dto/department.schema';
import { DepartmentsSharedService } from './departments-shared.service';
import { DepartmentsScopeService } from './departments-scope.service';

@Injectable()
export class DepartmentsUnitsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly shared: DepartmentsSharedService,
    private readonly scope: DepartmentsScopeService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Create a brand-new unit directly under a department (ADMIN+, or the department's own Admin Head/HOD). */
  async createUnit(actor: AuthUser, deptId: string, raw: unknown) {
    const dto = parseSchema(CreateUnitInDeptSchema, raw);
    await this.shared.deptOrThrow(deptId);
    await this.scope.assertCanTargetDept(actor, deptId);
    const unit = await this.prisma.unit.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        departmentId: deptId,
      },
    });
    await this.shared.writeAudit({
      action: 'CREATE_UNIT',
      entity: 'Unit',
      entityId: unit.id,
      actorId: actor.userId,
      after: { name: unit.name, departmentId: deptId },
    });
    return unit;
  }

  async assignUnits(actor: AuthUser, deptId: string, raw: unknown) {
    const dto = parseSchema(AssignUnitsSchema, raw);
    await this.shared.deptOrThrow(deptId);
    const res = await this.prisma.unit.updateMany({
      where: { id: { in: dto.unitIds }, tenantId: this.tenantId },
      data: { departmentId: deptId },
    });
    await this.shared.writeAudit({ action: 'ASSIGN_UNITS', entity: 'Department', entityId: deptId, actorId: actor.userId, after: { unitIds: dto.unitIds } });
    return { assigned: res.count };
  }

  async unassignUnit(actor: AuthUser, unitId: string) {
    const res = await this.prisma.unit.updateMany({
      where: { id: unitId, tenantId: this.tenantId },
      data: { departmentId: null },
    });
    if (!res.count) throw new NotFoundException('Unit not found');
    await this.shared.writeAudit({ action: 'UNASSIGN_UNIT', entity: 'Unit', entityId: unitId, actorId: actor.userId });
    return { unitId, unassigned: true };
  }
}
