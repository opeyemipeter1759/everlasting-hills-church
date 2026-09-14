import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailDispatcher } from '../../jobs/mail-dispatcher';
import { InboxService } from '../../inbox/inbox.service';
import { buildUnitTaskAssignedEmail } from '../../notifications/templates/unit-task-assigned.email';
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

/** What a task row carries besides its own columns: the assignee, how much
 * discussion and reporting it has attracted, and the most recent report so
 * the list can show where things stand without a second request. */
const TASK_INCLUDE = {
  AssignedTo: { select: MEMBER_SELECT },
  _count: { select: { Comments: true, Reports: true } },
  Reports: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: { id: true, outcome: true, status: true, createdAt: true, authorId: true },
  },
} as const;

type TaskRow = {
  Reports: { id: string; outcome: string; status: string; createdAt: Date; authorId: string }[];
  _count: { Comments: number; Reports: number };
};

function shapeTask<T extends TaskRow>({ Reports, ...task }: T) {
  const latest = Reports[0];
  return {
    ...task,
    latestReport: latest
      ? { id: latest.id, outcome: latest.outcome, status: latest.status, createdAt: latest.createdAt, authorId: latest.authorId }
      : null,
  };
}

@Injectable()
export class UnitTasksService {
  private readonly logger = new Logger(UnitTasksService.name);
  private readonly tenantId: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: UnitsMembershipService,
    private readonly mail: MailDispatcher,
    private readonly inbox: InboxService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl = (config.get('FRONTEND_URL', { infer: true }) as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:3000';
  }

  /**
   * Tell the assignee they have a task: an email plus an in-app notification.
   * Fire-and-forget — a mail hiccup must never fail the assignment itself.
   */
  private async notifyAssignee(
    actor: AuthUser,
    task: { id: string; unitId: string; title: string; description: string | null; dueDate: Date | null; assignedToId: string | null },
  ) {
    if (!task.assignedToId) return;
    try {
      const [assignee, unit, assigner] = await Promise.all([
        this.prisma.member.findFirst({
          where: { id: task.assignedToId, tenantId: this.tenantId },
          select: { firstName: true, email: true, profileId: true },
        }),
        this.prisma.unit.findFirst({ where: { id: task.unitId }, select: { name: true } }),
        actor.profileId
          ? this.prisma.profile.findUnique({
              where: { id: actor.profileId },
              select: { Member: { select: { firstName: true, lastName: true } } },
            })
          : null,
      ]);
      if (!assignee || !unit) return;
      const assignedByName = assigner?.Member
        ? `${assigner.Member.firstName} ${assigner.Member.lastName}`.trim()
        : 'Your unit lead';

      // Don't notify someone for assigning a task to themselves.
      if (assignee.profileId && assignee.profileId === actor.profileId) return;

      if (assignee.profileId) {
        await this.inbox.createMany([
          {
            tenantId: this.tenantId,
            profileId: assignee.profileId,
            title: `New task: ${task.title}`,
            body: `${assignedByName} assigned you a task in ${unit.name}.`,
            type: 'task-assigned',
            link: `/dashboard/unit/${task.unitId}`,
          },
        ]);
      }

      if (assignee.email) {
        await this.mail.dispatch(
          buildUnitTaskAssignedEmail({
            to: assignee.email,
            firstName: assignee.firstName,
            taskTitle: task.title,
            description: task.description,
            unitName: unit.name,
            assignedByName,
            dueDate: task.dueDate,
            appUrl: this.appUrl,
          }),
        );
      }
    } catch (err) {
      this.logger.warn(`Could not notify assignee of task ${task.id}: ${(err as Error).message}`);
    }
  }

  async list(actor: AuthUser, unitId: string) {
    // Any member of the unit can view tasks (not just lead/assistant) — a plain
    // member needs to see what's assigned to them.
    await this.membership.assertIsUnitMember(actor, unitId);
    const rows = await this.prisma.unitTask.findMany({
      where: { unitId, tenantId: this.tenantId },
      include: TASK_INCLUDE,
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(shapeTask);
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

    const created = await this.prisma.unitTask.create({
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
      include: TASK_INCLUDE,
    });
    void this.notifyAssignee(actor, created);
    return shapeTask(created);
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
      select: { id: true, assignedToId: true },
    });
    if (!exists) throw new NotFoundException('Task not found');

    if (dto.assignedToId) {
      const inUnit = await this.prisma.unitMember.findFirst({
        where: { unitId, memberId: dto.assignedToId, tenantId: this.tenantId },
        select: { id: true },
      });
      if (!inUnit) throw new NotFoundException('Assignee is not a member of this unit');
    }

    const updated = await this.prisma.unitTask.update({
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
      include: TASK_INCLUDE,
    });
    // Only a hand-off to a *different* person is news; status edits and the
    // like don't re-notify the assignee.
    if (dto.assignedToId && dto.assignedToId !== exists.assignedToId) {
      void this.notifyAssignee(actor, updated);
    }
    return shapeTask(updated);
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
