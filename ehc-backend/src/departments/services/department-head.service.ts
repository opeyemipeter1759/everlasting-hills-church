import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { EffectiveRolesService } from '../../auth/effective-roles.service';
import { parseSchema } from '../departments.util';
import { AssignHeadSchema } from '../dto/department.schema';
import { DepartmentsSharedService } from './departments-shared.service';
import { DepartmentsReadService } from './departments-read.service';

/** Department head assignment/removal — history-preserving, one active tenure per department. */
@Injectable()
export class DepartmentHeadService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly shared: DepartmentsSharedService,
    private readonly read: DepartmentsReadService,
    private readonly effectiveRoles: EffectiveRolesService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async assignHead(actor: AuthUser, deptId: string, raw: unknown) {
    const dto = parseSchema(AssignHeadSchema, raw);
    await this.shared.deptOrThrow(deptId);

    const profile = await this.prisma.profile.findFirst({
      where: { id: dto.profileId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Person not found');

    const current = await this.prisma.departmentHead.findFirst({
      where: { tenantId: this.tenantId, departmentId: deptId, endedAt: null },
    });
    if (current && current.userId === dto.profileId) {
      return this.read.getOne(deptId); // already the head, no-op, no new tenure
    }

    // End the current tenure and open a new one atomically (the partial unique
    // index guarantees at most one active head per department).
    const row = await this.prisma.$transaction(async (tx) => {
      if (current) {
        await tx.departmentHead.update({ where: { id: current.id }, data: { endedAt: new Date() } });
      }
      return tx.departmentHead.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          departmentId: deptId,
          userId: dto.profileId,
          assignedById: actor.profileId ?? null,
        },
      });
    });

    // The ADMIN_HEAD effective role is derived from this active DepartmentHead row,
    // so no explicit role grant is needed; it applies on the person's next request.

    await this.shared.writeAudit({
      action: 'ASSIGN_HEAD',
      entity: 'DepartmentHead',
      entityId: row.id,
      actorId: actor.userId,
      before: current ? { previousHeadProfileId: current.userId } : undefined,
      after: { departmentId: deptId, headProfileId: dto.profileId },
    });
    if (current) this.effectiveRoles.invalidate(current.userId);
    this.effectiveRoles.invalidate(dto.profileId);
    return this.read.getOne(deptId);
  }

  async removeHead(actor: AuthUser, deptId: string) {
    await this.shared.deptOrThrow(deptId);
    const current = await this.prisma.departmentHead.findFirst({
      where: { tenantId: this.tenantId, departmentId: deptId, endedAt: null },
    });
    if (!current) throw new BadRequestException('This department has no active head');
    await this.prisma.departmentHead.update({ where: { id: current.id }, data: { endedAt: new Date() } });
    // Role is intentionally NOT demoted: the person keeps ADMIN_HEAD and sees an
    // empty Admin Head dashboard until reassigned.
    await this.shared.writeAudit({ action: 'REMOVE_HEAD', entity: 'DepartmentHead', entityId: current.id, actorId: actor.userId, before: { headProfileId: current.userId } });
    this.effectiveRoles.invalidate(current.userId);
    return this.read.getOne(deptId);
  }
}
