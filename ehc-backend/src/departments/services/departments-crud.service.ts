import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { parseSchema } from '../departments.util';
import { CreateDepartmentSchema, UpdateDepartmentSchema } from '../dto/department.schema';
import { DepartmentsSharedService } from './departments-shared.service';

@Injectable()
export class DepartmentsCrudService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly shared: DepartmentsSharedService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async create(actor: AuthUser, raw: unknown) {
    const dto = parseSchema(CreateDepartmentSchema, raw);
    const exists = await this.prisma.department.findFirst({
      where: { tenantId: this.tenantId, code: dto.code },
      select: { id: true },
    });
    if (exists) throw new BadRequestException(`A department with code ${dto.code} already exists`);
    const dept = await this.prisma.department.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    await this.shared.writeAudit({ action: 'CREATE', entity: 'Department', entityId: dept.id, actorId: actor.userId, after: { code: dept.code, name: dept.name } });
    return dept;
  }

  async update(actor: AuthUser, id: string, raw: unknown) {
    const dto = parseSchema(UpdateDepartmentSchema, raw);
    const before = await this.shared.deptOrThrow(id);
    const dept = await this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description ?? null }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
    await this.shared.writeAudit({ action: 'UPDATE', entity: 'Department', entityId: id, actorId: actor.userId, before: { name: before.name }, after: { name: dept.name } });
    return dept;
  }

  async remove(actor: AuthUser, id: string) {
    const dept = await this.shared.deptOrThrow(id);
    // Units fall back to unassigned via ON DELETE SET NULL. Head history rows are
    // removed with the department (ON DELETE CASCADE); the department is gone.
    await this.prisma.department.delete({ where: { id } });
    await this.shared.writeAudit({ action: 'DELETE', entity: 'Department', entityId: id, actorId: actor.userId, before: { code: dept.code, name: dept.name } });
    return { id, deleted: true };
  }
}
