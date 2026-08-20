import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import type { CreateUnitTaskDto, UpdateUnitTaskDto } from '../dto/unit-task.dto';
import { UnitsMembershipService } from './units-membership.service';

const MEMBER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  photoUrl: true,
} as const;

@Injectable()
export class UnitTasksService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: UnitsMembershipService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async list(actor: AuthUser, unitId: string) {
    // Any member of the unit can view tasks (not just lead/assistant) — a plain
    // member needs to see what's assigned to them.
    await this.membership.assertIsUnitMember(actor, unitId);
    return this.prisma.unitTask.findMany({
      where: { unitId, tenantId: this.tenantId },
      include: { AssignedTo: { select: MEMBER_SELECT } },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(actor: AuthUser, unitId: string, dto: CreateUnitTaskDto) {
    await this.membership.assertCanManageUnit(actor, unitId);

    if (dto.assignedToId) {
      const inUnit = await this.prisma.unitMember.findFirst({
        where: { unitId, memberId: dto.assignedToId, tenantId: this.tenantId },
        select: { id: true },
      });
      if (!inUnit) throw new NotFoundException('Assignee is not a member of this unit');
    }

    return this.prisma.unitTask.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        unitId,
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        assignedToId: dto.assignedToId ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        createdById: actor.profileId!,
      },
      include: { AssignedTo: { select: MEMBER_SELECT } },
    });
  }

  /**
   * Lead/assistant of the unit can edit anything. A member who isn't lead/assistant
   * may only update the status of a task assigned to them (e.g. marking it done).
   */
  private async assertCanTouchTask(actor: AuthUser, unitId: string, taskId: string, dto: UpdateUnitTaskDto) {
    try {
      await this.membership.assertCanManageUnit(actor, unitId);
      return;
    } catch (err) {
      const onlyStatusChange = Object.keys(dto).every((k) => k === 'status');
      if (!onlyStatusChange || !actor.memberId) throw err;

      const task = await this.prisma.unitTask.findFirst({
        where: { id: taskId, unitId, tenantId: this.tenantId },
        select: { assignedToId: true },
      });
      if (!task || task.assignedToId !== actor.memberId) {
        throw new ForbiddenException('You can only update the status of tasks assigned to you');
      }
    }
  }

  async update(actor: AuthUser, unitId: string, taskId: string, dto: UpdateUnitTaskDto) {
    await this.assertCanTouchTask(actor, unitId, taskId, dto);

    const exists = await this.prisma.unitTask.findFirst({
      where: { id: taskId, unitId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Task not found');

    if (dto.assignedToId) {
      const inUnit = await this.prisma.unitMember.findFirst({
        where: { unitId, memberId: dto.assignedToId, tenantId: this.tenantId },
        select: { id: true },
      });
      if (!inUnit) throw new NotFoundException('Assignee is not a member of this unit');
    }

    return this.prisma.unitTask.update({
      where: { id: taskId },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() ?? null }),
        ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
        ...(dto.status !== undefined && {
          status: dto.status,
          completedAt: dto.status === 'DONE' ? new Date() : null,
        }),
      },
      include: { AssignedTo: { select: MEMBER_SELECT } },
    });
  }

  async delete(actor: AuthUser, unitId: string, taskId: string) {
    await this.membership.assertCanManageUnit(actor, unitId);
    const result = await this.prisma.unitTask.deleteMany({
      where: { id: taskId, unitId, tenantId: this.tenantId },
    });
    if (result.count === 0) throw new NotFoundException('Task not found');
    return { id: taskId, deleted: true };
  }
}
