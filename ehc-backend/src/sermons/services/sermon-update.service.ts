import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SermonStatus, SermonType } from '@prisma/client';
import { randomUUID } from 'crypto';
import slugify from 'slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailsService } from '../../emails/emails.service';
import type { Env } from '../../config/env.validation';
import {
  SERMON_COUNTS_INCLUDE,
  SERMON_EPISODES_INCLUDE,
  makeSlug,
  resolveSingleDuration,
  resolveSingleUrl,
  serializeSermon,
  type SermonEpisodeInputLike,
} from '../sermon-serialization.util';
import { SermonAdminReadService } from './sermon-admin-read.service';

@Injectable()
export class SermonUpdateService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sermonRead: SermonAdminReadService,
    private readonly emails: EmailsService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async updateSermon(
    id: string,
    data: Partial<{
      title: string;
      speaker: string;
      date: string;
      type: SermonType;
      url: string;
      duration: number;
      episodes: SermonEpisodeInputLike[];
      description: string;
      transcript: string;
      scriptureRef: string;
      series: string;
      tags: string[];
      audioUrl: string;
      audioKey: string;
      audioDuration: number;
      videoUrl: string;
      thumbnailUrl: string;
      status: SermonStatus;
      scheduledFor: string;
      isFeatured: boolean;
    }>,
  ) {
    const current = await this.prisma.sermon.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!current) {
      throw new NotFoundException('Sermon not found');
    }

    const sermonType = data.type ?? (data.episodes?.length ? SermonType.SERIES : current.type);
    const singleUrl = resolveSingleUrl(data);
    const singleDuration = resolveSingleDuration(data);

    if (data.episodes && data.episodes.length === 0) {
      throw new BadRequestException('Series sermons require at least one episode.');
    }
    if (sermonType === SermonType.SINGLE && data.episodes?.length) {
      throw new BadRequestException('Single sermons cannot include episodes.');
    }

    const nowPublishing = data.status === SermonStatus.PUBLISHED && current.status !== SermonStatus.PUBLISHED;

    const sermon = await this.prisma.sermon.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title, slug: makeSlug(data.title, data.date ?? current.date) }),
        ...(data.speaker && { speaker: data.speaker }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.type && { type: data.type }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.transcript !== undefined && { transcript: data.transcript }),
        ...(data.scriptureRef !== undefined && { scriptureRef: data.scriptureRef }),
        ...(data.series !== undefined && {
          series: data.series,
          seriesSlug: data.series ? slugify(data.series, { lower: true, strict: true }) : null,
        }),
        ...(data.tags && { tags: data.tags }),
        ...(sermonType === SermonType.SINGLE && singleUrl !== undefined && { audioUrl: singleUrl }),
        ...(sermonType === SermonType.SINGLE && data.audioKey !== undefined && { audioKey: data.audioKey }),
        ...(sermonType === SermonType.SINGLE && singleDuration !== undefined && { audioDuration: singleDuration }),
        ...(sermonType === SermonType.SINGLE && data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(sermonType === SermonType.SERIES && { audioUrl: null, audioDuration: null, videoUrl: null }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        ...(data.status && { status: data.status }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.scheduledFor !== undefined && {
          scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        }),
        ...(nowPublishing && { publishedAt: new Date() }),
        updatedAt: new Date(),
      },
      include: {
        ...SERMON_EPISODES_INCLUDE,
        ...SERMON_COUNTS_INCLUDE,
      },
    });

    if (nowPublishing) {
      void this.emails.notifyNewContent({ kind: 'sermon', title: sermon.title, path: `/dashboard/sermon/${sermon.slug}` });
    }

    const hasEpisodeChanges = sermonType === SermonType.SERIES && !!data.episodes;
    const isConvertingToSingle = sermonType === SermonType.SINGLE && current.type === SermonType.SERIES;

    if (hasEpisodeChanges) {
      const episodeInputs = data.episodes ?? [];
      await this.prisma.sermonEpisode.deleteMany({ where: { sermonId: id, tenantId: this.tenantId } });
      await this.prisma.sermonEpisode.createMany({
        data: episodeInputs.map((episode, index) => ({
          id: episode.id ?? randomUUID(),
          tenantId: this.tenantId,
          sermonId: id,
          title: episode.title,
          url: episode.url,
          duration: episode.duration,
          order: episode.order ?? index,
          updatedAt: new Date(),
        })),
      });
      return this.sermonRead.getSermonById(id);
    }

    if (isConvertingToSingle) {
      await this.prisma.sermonEpisode.deleteMany({ where: { sermonId: id, tenantId: this.tenantId } });
      return this.sermonRead.getSermonById(id);
    }

    return serializeSermon(sermon);
  }
}
