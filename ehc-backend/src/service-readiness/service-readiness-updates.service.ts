import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { ReadinessState, ReadinessStatus } from '@prisma/client';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceReadinessNotifyService } from './service-readiness-notify.service';
import { readinessRecordFor } from './readiness-record';
import type { PostReadinessUpdateDto } from './dto/post-readiness-update.dto';

/**
 * After a unit submits its plan: its leader posts updates (everything ready,
 * or a blocker), and the Church Administrator approves the plan. Admin,
 * Admin Head, Super Admin and Pastor are emailed on every update.
 */
@Injectable()
export class ServiceReadinessUpdatesService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: ServiceReadinessNotifyService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Everything ready, or a blocker (which must say what it is). */
  async postUpdate(actor: AuthUser, serviceId: string, unitId: string, dto: PostReadinessUpdateDto) {
    const record = await readinessRecordFor(this.prisma, this.tenantId, actor, serviceId, unitId);
    if (record.state === ReadinessState.NOT_STARTED) throw new BadRequestException('Submit the plan before posting an update');
    const note = dto.note?.trim() || null;
    const blocked = dto.status === ReadinessStatus.BLOCKED;
    if (blocked && !note) throw new BadRequestException('Say what the blocker is');
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.readinessUpdate.create({
        data: { id: randomUUID(), tenantId: this.tenantId, readinessId: record.id, status: dto.status, note, byId: actor.profileId, createdAt: now },
      }),
      this.prisma.serviceReadiness.update({
        where: { id: record.id },
        data: { status: dto.status, blocker: blocked ? note : null, statusUpdatedAt: now },
      }),
    ]);
    await this.notify.statusUpdated({
      serviceType: record.Service.serviceType, unitName: record.Unit.name, byProfileId: actor.profileId, blocked, note,
    });
    return { saved: true, status: dto.status };
  }

  /** The Church Administrator approves a submitted plan. */
  async approve(actor: AuthUser, serviceId: string, unitId: string) {
    const record = await this.prisma.serviceReadiness.findFirst({
      where: { tenantId: this.tenantId, serviceId, unitId },
      select: { id: true, state: true },
    });
    if (!record) throw new NotFoundException('No plan for this unit at that service');
    if (record.state === ReadinessState.NOT_STARTED) throw new BadRequestException('This unit has not submitted its plan yet');
    await this.prisma.serviceReadiness.update({ where: { id: record.id }, data: { approvedAt: new Date(), approvedById: actor.profileId } });
    return { approved: true };
  }
}
