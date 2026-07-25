import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { serializeEpisode } from '../sermon-serialization.util';

@Injectable()
export class SermonEpisodeService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getEpisodeBySermonId(sermonId: string, episodeId: string) {
    const sermon = await this.prisma.sermon.findFirst({
      where: { id: sermonId, tenantId: this.tenantId },
      include: { Episodes: { orderBy: { order: 'asc' } } },
    });
    if (!sermon) throw new NotFoundException('Sermon not found');

    const episode = sermon.Episodes.find((item) => item.id === episodeId);
    if (!episode) throw new NotFoundException('Episode not found');

    return serializeEpisode(episode);
  }

  async getEpisodeBySlug(slug: string, episodeId: string) {
    const sermon = await this.prisma.sermon.findFirst({
      where: { slug, tenantId: this.tenantId },
      include: { Episodes: { orderBy: { order: 'asc' } } },
    });
    if (!sermon) throw new NotFoundException('Sermon not found');

    const episode = sermon.Episodes.find((item) => item.id === episodeId);
    if (!episode) throw new NotFoundException('Episode not found');

    return serializeEpisode(episode);
  }

  async incrementPlayCount(id: string) {
    return this.prisma.sermon.update({
      where: { id },
      data: { playCount: { increment: 1 }, updatedAt: new Date() },
    });
  }
}
