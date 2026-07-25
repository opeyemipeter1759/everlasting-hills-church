import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SermonStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { SERMON_COUNTS_INCLUDE, SERMON_EPISODES_INCLUDE, serializeSermon } from '../sermon-serialization.util';

/** Public (unauthenticated) sermon reads. */
@Injectable()
export class SermonPublicReadService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getPublishedSermons(opts?: { series?: string; search?: string; limit?: number }) {
    const sermons = await this.prisma.sermon.findMany({
      where: {
        tenantId: this.tenantId,
        status: SermonStatus.PUBLISHED,
        ...(opts?.series && { seriesSlug: opts.series }),
        ...(opts?.search && {
          OR: [
            { title: { contains: opts.search, mode: 'insensitive' } },
            { speaker: { contains: opts.search, mode: 'insensitive' } },
            { scriptureRef: { contains: opts.search, mode: 'insensitive' } },
            { series: { contains: opts.search, mode: 'insensitive' } },
            { description: { contains: opts.search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { date: 'desc' },
      take: opts?.limit,
      include: {
        ...SERMON_EPISODES_INCLUDE,
        ...SERMON_COUNTS_INCLUDE,
      },
    });

    return sermons.map(serializeSermon);
  }

  async getSermonBySlug(slug: string) {
    const sermon = await this.prisma.sermon.findFirst({
      where: { slug, tenantId: this.tenantId },
      include: {
        DiscussionQuestion: {
          orderBy: { order: 'asc' },
          include: {
            DiscussionResponse: {
              include: { Member: { select: { firstName: true, lastName: true, photoUrl: true } } },
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

  async getFeaturedSermon() {
    const sermon = await this.prisma.sermon.findFirst({
      where: { tenantId: this.tenantId, status: SermonStatus.PUBLISHED, isFeatured: true },
      include: {
        ...SERMON_EPISODES_INCLUDE,
        ...SERMON_COUNTS_INCLUDE,
      },
    });

    return sermon ? serializeSermon(sermon) : null;
  }

  async getLatestSermons(limit = 3) {
    const sermons = await this.prisma.sermon.findMany({
      where: { tenantId: this.tenantId, status: SermonStatus.PUBLISHED },
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        ...SERMON_EPISODES_INCLUDE,
        ...SERMON_COUNTS_INCLUDE,
      },
    });

    return sermons.map(serializeSermon);
  }

  async getSeriesList() {
    const sermons = await this.prisma.sermon.findMany({
      where: { tenantId: this.tenantId, status: SermonStatus.PUBLISHED, series: { not: null } },
      orderBy: { date: 'desc' },
      include: {
        ...SERMON_EPISODES_INCLUDE,
        ...SERMON_COUNTS_INCLUDE,
      },
    });

    return sermons.map(serializeSermon);
  }
}
