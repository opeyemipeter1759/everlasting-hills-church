import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { EffectiveRolesService } from '../../auth/effective-roles.service';
import { personLabel, parseSchema } from '../departments.util';
import { AssignHeadSchema } from '../dto/department.schema';
import { DepartmentsSharedService } from './departments-shared.service';
import { DepartmentsScopeService } from './departments-scope.service';

/** HOD assignment: many active per department, appointed by that department's Admin Head+. */
@Injectable()
export class DepartmentHodService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly shared: DepartmentsSharedService,
    private readonly scope: DepartmentsScopeService,
    private readonly effectiveRoles: EffectiveRolesService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async listHods(deptId: string) {
    const rows = await this.prisma.departmentHod.findMany({
      where: { tenantId: this.tenantId, departmentId: deptId, endedAt: null },
      orderBy: { assignedAt: 'desc' },
      include: {
        User: { select: { id: true, Member: { select: { firstName: true, lastName: true, photoUrl: true } } } },
      },
    });
    return rows.map((r) => ({ ...personLabel(r.User), assignedAt: r.assignedAt.toISOString() }));
  }

  async assignHod(actor: AuthUser, deptId: string, raw: unknown) {
    const dto = parseSchema(AssignHeadSchema, raw); // same shape: { profileId }
    await this.shared.deptOrThrow(deptId);
    await this.scope.assertCanAssignHod(actor, deptId);

    const profile = await this.prisma.profile.findFirst({
      where: { id: dto.profileId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Person not found');

    const existing = await this.prisma.departmentHod.findFirst({
      where: { tenantId: this.tenantId, departmentId: deptId, userId: dto.profileId, endedAt: null },
    });
    if (!existing) {
      const row = await this.prisma.departmentHod.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          departmentId: deptId,
          userId: dto.profileId,
          assignedById: actor.profileId ?? null,
        },
      });
      await this.shared.writeAudit({
        action: 'ASSIGN_HOD',
        entity: 'DepartmentHod',
        entityId: row.id,
        actorId: actor.userId,
        after: { departmentId: deptId, hodProfileId: dto.profileId },
      });
      this.effectiveRoles.invalidate(dto.profileId);
    }
    return { hods: await this.listHods(deptId) };
  }

  async removeHod(actor: AuthUser, deptId: string, profileId: string) {
    await this.shared.deptOrThrow(deptId);
    await this.scope.assertCanAssignHod(actor, deptId);

    const current = await this.prisma.departmentHod.findFirst({
      where: { tenantId: this.tenantId, departmentId: deptId, userId: profileId, endedAt: null },
    });
    if (!current) throw new BadRequestException('This person is not an active HOD of this department');
    await this.prisma.departmentHod.update({ where: { id: current.id }, data: { endedAt: new Date() } });
    await this.shared.writeAudit({ action: 'REMOVE_HOD', entity: 'DepartmentHod', entityId: current.id, actorId: actor.userId, before: { hodProfileId: profileId } });
    this.effectiveRoles.invalidate(profileId);
    return { hods: await this.listHods(deptId) };
  }
}
