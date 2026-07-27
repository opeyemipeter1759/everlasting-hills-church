import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SermonStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { SERMON_COUNTS_INCLUDE, SERMON_EPISODES_INCLUDE, serializeSermon } from '../sermon-serialization.util';

/** Admin reads: full sermon list and single-sermon detail (with discussion threads). */
@Injectable()
export class SermonAdminReadService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getAllSermons(opts?: { status?: SermonStatus; series?: string }) {
    const sermons = await this.prisma.sermon.findMany({
      where: {
        tenantId: this.tenantId,
        ...(opts?.status && { status: opts.status }),
        ...(opts?.series && { seriesSlug: opts.series }),
      },
      orderBy: { date: 'desc' },
      include: {
        ...SERMON_EPISODES_INCLUDE,
        ...SERMON_COUNTS_INCLUDE,
      },
    });

    return sermons.map(serializeSermon);
  }

  async getSermonById(id: string) {
    const sermon = await this.prisma.sermon.findFirst({
      where: { id, tenantId: this.tenantId },
      include: {
        DiscussionQuestion: {
          orderBy: { order: 'asc' },
          include: {
            DiscussionResponse: {
              include: {
                Member: { select: { firstName: true, lastName: true, photoUrl: true } },
              },
            },
          },
        },
        ...SERMON_EPISODES_INCLUDE,
        ...SERMON_COUNTS_INCLUDE,
      },
    });

    if (!sermon) {
      throw new NotFoundException('Sermon not found');
    }

    return serializeSermon(sermon);
  }
}
