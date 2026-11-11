import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { isChurchAdministrator, unitsHeadedBy } from './readiness-access';
import { readinessRecordFor } from './readiness-record';
import { ServiceReadinessNotifyService } from './service-readiness-notify.service';
import type { AddReadinessTasksDto, UpdateReadinessTaskDto } from './dto/readiness-task.dto';

/**
 * A unit's plan for a service is its task list. Unit leaders write and tick
 * off their own tasks; the Church Administrator can add tasks too, and the
 * unit's leaders are emailed when that happens. Only the Administrator can
 * change or remove a task the Administrator added.
 */
@Injectable()
export class ServiceReadinessTasksService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: ServiceReadinessNotifyService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async add(actor: AuthUser, serviceId: string, unitId: string, dto: AddReadinessTasksDto) {
    const record = await readinessRecordFor(this.prisma, this.tenantId, actor, serviceId, unitId);
    const titles = dto.titles.map((t) => t.trim()).filter(Boolean);
    if (!titles.length) throw new BadRequestException('Write the task first');
    // readinessRecordFor let them in, so someone who doesn't lead the unit is the Administrator.
    const byAdministrator = !(await unitsHeadedBy(this.prisma, this.tenantId, actor)).includes(unitId);
    const last = await this.prisma.readinessTask.aggregate({ where: { readinessId: record.id }, _max: { position: true } });
    const start = (last._max.position ?? -1) + 1;
    await this.prisma.readinessTask.createMany({
      data: titles.map((title, i) => ({
        id: randomUUID(), tenantId: this.tenantId, readinessId: record.id, title, position: start + i,
        createdById: actor.profileId, byAdministrator,
      })),
    });
    if (byAdministrator) {
      await this.notify.tasksAdded({ unitId, unitName: record.Unit.name, serviceType: record.Service.serviceType, titles, byProfileId: actor.profileId });
    }
    return { added: titles.length };
  }

  async update(actor: AuthUser, serviceId: string, unitId: string, taskId: string, dto: UpdateReadinessTaskDto) {
    const task = await this.taskFor(actor, serviceId, unitId, taskId);
    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) {
      if (task.byAdministrator && !isChurchAdministrator(actor)) throw new ForbiddenException('Only the Administrator can change a task they added');
      const title = dto.title.trim();
      if (!title) throw new BadRequestException('A task needs a name');
      data.title = title;
    }
    if (dto.done !== undefined) {
      Object.assign(data, dto.done ? { done: true, doneAt: new Date(), doneById: actor.profileId } : { done: false, doneAt: null, doneById: null });
    }
    await this.prisma.readinessTask.update({ where: { id: task.id }, data });
    return { saved: true };
  }

  async remove(actor: AuthUser, serviceId: string, unitId: string, taskId: string) {
    const task = await this.taskFor(actor, serviceId, unitId, taskId);
    if (task.byAdministrator && !isChurchAdministrator(actor)) throw new ForbiddenException('Only the Administrator can remove a task they added');
    await this.prisma.readinessTask.delete({ where: { id: task.id } });
    return { deleted: true };
  }

  private async taskFor(actor: AuthUser, serviceId: string, unitId: string, taskId: string) {
    const record = await readinessRecordFor(this.prisma, this.tenantId, actor, serviceId, unitId);
    const task = await this.prisma.readinessTask.findFirst({ where: { id: taskId, readinessId: record.id }, select: { id: true, byAdministrator: true } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }
}
