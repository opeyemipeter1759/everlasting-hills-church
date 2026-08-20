import { BadRequestException, Injectable } from '@nestjs/common';
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
  resolveSeriesType,
  resolveSingleDuration,
  resolveSingleUrl,
  serializeSermon,
  type SermonEpisodeInputLike,
} from '../sermon-serialization.util';

@Injectable()
export class SermonCreateService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emails: EmailsService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async createSermon(data: {
    title: string;
    speaker: string;
    date: string;
    type?: SermonType;
    url?: string;
    duration?: number;
    episodes?: SermonEpisodeInputLike[];
    description?: string;
    transcript?: string;
    scriptureRef?: string;
    series?: string;
    tags?: string[];
    audioUrl?: string;
    audioKey?: string;
    audioDuration?: number;
    videoUrl?: string;
    thumbnailUrl?: string;
    status?: SermonStatus;
    scheduledFor?: string;
  }) {
    const sermonType = resolveSeriesType(data);
    const singleUrl = resolveSingleUrl(data);
    const singleDuration = resolveSingleDuration(data);

    if (data.episodes && data.episodes.length === 0) {
      throw new BadRequestException('Series sermons require at least one episode.');
    }
    if (sermonType === SermonType.SERIES && !data.episodes?.length) {
      throw new BadRequestException('Series sermons require at least one episode.');
    }
    if (sermonType === SermonType.SINGLE && data.episodes?.length) {
      throw new BadRequestException('Single sermons cannot include episodes.');
    }

    const slug = makeSlug(data.title, data.date);
    const sermon = await this.prisma.sermon.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        title: data.title,
        slug,
        speaker: data.speaker,
        date: new Date(data.date),
        type: sermonType,
        description: data.description ?? null,
        transcript: data.transcript ?? null,
        scriptureRef: data.scriptureRef ?? null,
        series: data.series ?? null,
        seriesSlug: data.series ? slugify(data.series, { lower: true, strict: true }) : null,
        tags: data.tags ?? [],
        audioUrl: sermonType === SermonType.SINGLE ? singleUrl ?? null : null,
        audioKey: data.audioKey ?? null,
        audioDuration: sermonType === SermonType.SINGLE ? singleDuration ?? null : null,
        videoUrl: sermonType === SermonType.SINGLE ? data.videoUrl ?? null : null,
        thumbnailUrl: data.thumbnailUrl ?? null,
        status: data.status ?? SermonStatus.DRAFT,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        publishedAt: data.status === SermonStatus.PUBLISHED ? new Date() : null,
        updatedAt: new Date(),
        Episodes:
          sermonType === SermonType.SERIES && data.episodes
            ? {
                create: data.episodes.map((episode, index) => ({
                  id: episode.id ?? randomUUID(),
                  tenantId: this.tenantId,
                  title: episode.title,
                  url: episode.url,
                  duration: episode.duration,
                  order: episode.order ?? index,
                  updatedAt: new Date(),
                })),
              }
            : undefined,
      },
      include: {
        ...SERMON_EPISODES_INCLUDE,
        ...SERMON_COUNTS_INCLUDE,
      },
    });

    if (sermon.status === SermonStatus.PUBLISHED) {
      void this.emails.notifyNewContent({ kind: 'sermon', title: sermon.title, path: `/dashboard/sermon/${sermon.slug}` });
    }

    return serializeSermon(sermon);
  }
}
