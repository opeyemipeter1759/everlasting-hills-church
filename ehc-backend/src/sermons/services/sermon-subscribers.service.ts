import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SermonStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

@Injectable()
export class SermonSubscribersService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async subscribeEmail(email: string) {
    return this.prisma.emailSubscriber.upsert({
      where: { tenantId_email: { tenantId: this.tenantId, email } },
      create: { id: randomUUID(), tenantId: this.tenantId, email },
      update: {},
    });
  }

  async getSubscribers() {
    return this.prisma.emailSubscriber.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { subscribedAt: 'desc' },
    });
  }

  async publishScheduledSermons() {
    return this.prisma.sermon.updateMany({
      where: {
        tenantId: this.tenantId,
        status: SermonStatus.SCHEDULED,
        scheduledFor: { lte: new Date() },
      },
      data: { status: SermonStatus.PUBLISHED, publishedAt: new Date(), updatedAt: new Date() },
    });
  }
}
