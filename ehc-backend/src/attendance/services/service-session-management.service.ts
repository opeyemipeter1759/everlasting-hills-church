import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { ServiceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { PushEvents, type ServiceLivePayload } from '../../push/push.events';

/** ADMIN CRUD + open/close lifecycle for a Service session. */
@Injectable()
export class ServiceSessionManagementService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emitter: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async createService(input: { name: string; scheduledAt: string; serviceType?: ServiceType }) {
    return this.prisma.service.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        name: input.name.trim(),
        scheduledAt: new Date(input.scheduledAt),
        ...(input.serviceType ? { serviceType: input.serviceType } : {}),
      },
    });
  }

  /** Edits name/date/type only — open/close state is managed via openService/closeService. */
  async updateService(
    serviceId: string,
    input: { name?: string; scheduledAt?: string; serviceType?: ServiceType },
  ) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId: this.tenantId },
    });
    if (!service) throw new NotFoundException('Service not found');
    return this.prisma.service.update({
      where: { id: serviceId },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.scheduledAt !== undefined && { scheduledAt: new Date(input.scheduledAt) }),
        ...(input.serviceType !== undefined && { serviceType: input.serviceType }),
      },
    });
  }

  /** Deletes a service and its check-in records (ServiceHeadcount cascades at the DB level). */
  async removeService(serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId: this.tenantId },
    });
    if (!service) throw new NotFoundException('Service not found');
    await this.prisma.$transaction([
      this.prisma.attendanceRecord.deleteMany({ where: { serviceId, tenantId: this.tenantId } }),
      this.prisma.service.delete({ where: { id: serviceId } }),
    ]);
    return { id: serviceId, deleted: true };
  }

  /** Open a session for check-in. Stamps openAt the first time it opens. */
  async openService(serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId: this.tenantId },
    });
    if (!service) throw new NotFoundException('Service not found');

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: { isOpen: true, openAt: service.openAt ?? new Date() },
    });

    // Only on the transition into open. Re-opening an already-open service (a
    // double tap, or a close and re-open) must not notify the church twice.
    if (!service.isOpen) {
      this.emitter.emit(PushEvents.ServiceLive, {
        tenantId: this.tenantId,
        serviceId: updated.id,
        serviceName: updated.name,
      } satisfies ServiceLivePayload);
    }

    return updated;
  }

  /** Close a session. Stamps closeAt. */
  async closeService(serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId: this.tenantId },
    });
    if (!service) throw new NotFoundException('Service not found');
    return this.prisma.service.update({
      where: { id: serviceId },
      data: { isOpen: false, closeAt: new Date() },
    });
  }
}
