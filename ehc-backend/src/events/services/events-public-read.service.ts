import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { EVENT_SUMMARY_SELECT } from '../events.util';

@Injectable()
export class EventsPublicReadService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Public: published events, featured first then soonest. */
  async listPublished() {
    return this.prisma.event.findMany({
      where: { tenantId: this.tenantId, status: EventStatus.PUBLISHED },
      orderBy: [{ featured: 'desc' }, { startAt: 'asc' }],
      select: EVENT_SUMMARY_SELECT,
    });
  }

  /** Public: a single published event by slug. */
  async getBySlug(slug: string) {
    const event = await this.prisma.event.findFirst({
      where: { tenantId: this.tenantId, slug, status: EventStatus.PUBLISHED },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }
}
