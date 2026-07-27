import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

@Injectable()
export class EventsAdminReadService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Admin: all events including drafts, with RSVP counts. */
  async listAll() {
    return this.prisma.event.findMany({
      where: { tenantId: this.tenantId },
      orderBy: [{ startAt: 'desc' }],
      include: { _count: { select: { Rsvps: true } } },
    });
  }

  async getById(id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, tenantId: this.tenantId },
      include: { _count: { select: { Rsvps: true } } },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }
}
