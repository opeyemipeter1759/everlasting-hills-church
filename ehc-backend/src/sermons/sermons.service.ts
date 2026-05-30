import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SermonStatus, SermonType } from '@prisma/client';
import { randomUUID } from 'crypto';
import slugify from 'slugify';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';

type SermonEpisodeLike = {
  id: string;
  title: string;
  url: string;
  duration: number;
  order: number;
};

type SermonEpisodeInputLike = {
  id?: string;
  title: string;
  url: string;
  duration: number;
  order?: number;
};

type SermonLike = {
  id: string;
  type?: SermonType;
  audioUrl?: string | null;
  videoUrl?: string | null;
  audioDuration?: number | null;
  series?: string | null;
  seriesSlug?: string | null;
  isFeatured?: boolean;
  Episodes?: SermonEpisodeLike[];
  [key: string]: unknown;
};

const SERMON_COUNTS_INCLUDE = {
  _count: { select: { SermonReaction: true, SermonBookmark: true } },
} as const;

const SERMON_EPISODES_INCLUDE = {
  Episodes: { orderBy: { order: 'asc' } },
} as const;

function serializeEpisode(episode: SermonEpisodeLike) {
  return {
    id: episode.id,
    title: episode.title,
    url: episode.url,
    duration: episode.duration,
    order: episode.order,
  };
}

function serializeSermon(sermon: SermonLike) {
  const { Episodes, ...rest } = sermon;
  const episodes = (Episodes ?? []).map(serializeEpisode);
  const isSeries = sermon.type === SermonType.SERIES || Boolean(sermon.series) || Boolean(sermon.seriesSlug) || episodes.length > 0;

  return {
    ...rest,
    url: isSeries ? null : sermon.audioUrl ?? sermon.videoUrl ?? null,
    duration: isSeries ? null : sermon.audioDuration ?? null,
    episodes: isSeries ? episodes : [],
  };
}

function resolveSeriesType(data: { type?: SermonType; episodes?: SermonEpisodeInputLike[] }) {
  return data.type ?? (data.episodes?.length ? SermonType.SERIES : SermonType.SINGLE);
}

function resolveSingleUrl(data: {
  url?: string;
  audioUrl?: string;
  videoUrl?: string;
}) {
  return data.url ?? data.audioUrl ?? data.videoUrl ?? undefined;
}

function resolveSingleDuration(data: { duration?: number; audioDuration?: number }) {
  return data.duration ?? data.audioDuration ?? undefined;
}

function makeSlug(title: string, date: string | Date): string {
  const sermonDate = new Date(date);
  const suffix = `${sermonDate.getFullYear()}-${String(sermonDate.getMonth() + 1).padStart(2, '0')}`;
  return slugify(`${title}-${suffix}`, { lower: true, strict: true });
}

@Injectable()
export class SermonsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private async getMemberByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      return null;
    }

    return this.prisma.member.findUnique({ where: { profileId: profile.id } });
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
                Member: {
                  select: {
                    firstName: true,
                    lastName: true,
                    photoUrl: true,
                  },
                },
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

    return serializeSermon(sermon);
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

    if (sermonType === SermonType.SERIES && data.episodes && data.episodes.length === 0) {
      throw new BadRequestException('Series sermons require at least one episode.');
    }

    if (sermonType === SermonType.SINGLE && data.episodes?.length) {
      throw new BadRequestException('Single sermons cannot include episodes.');
    }

    const nowPublishing =
      data.status === SermonStatus.PUBLISHED && current.status !== SermonStatus.PUBLISHED;

    const sermon = await this.prisma.sermon.update({
      where: { id },
      data: {
        ...(data.title && {
          title: data.title,
          slug: makeSlug(data.title, data.date ?? current.date),
        }),
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

      return this.getSermonById(id);
    }

    if (isConvertingToSingle) {
      await this.prisma.sermonEpisode.deleteMany({ where: { sermonId: id, tenantId: this.tenantId } });
      return this.getSermonById(id);
    }

    return serializeSermon(sermon);
  }

  /**
   * Tenant-scoped delete. Returns count so the controller can throw 404 when the id wasn't
   * in this tenant — defends against cross-tenant deletion if an attacker knows another
   * tenant's sermon UUID.
   */
  async deleteSermon(id: string) {
    const result = await this.prisma.sermon.deleteMany({ where: { id, tenantId: this.tenantId } });
    if (result.count === 0) {
      throw new NotFoundException('Sermon not found');
    }
    return { id, deleted: true };
  }

  /**
   * Tenant-scoped featured update. First confirms the target sermon belongs to this tenant
   * BEFORE clearing other featured flags — otherwise an attacker could wipe a victim
   * tenant's featured flag by knowing nothing more than any of their sermon ids.
   */
  async setFeaturedSermon(id: string) {
    const target = await this.prisma.sermon.findFirst({
      where: { id, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!target) {
      throw new NotFoundException('Sermon not found');
    }
    await this.prisma.sermon.updateMany({
      where: { tenantId: this.tenantId, isFeatured: true },
      data: { isFeatured: false },
    });
    const sermon = await this.prisma.sermon.update({
      where: { id },
      data: { isFeatured: true, updatedAt: new Date() },
      include: {
        ...SERMON_EPISODES_INCLUDE,
        ...SERMON_COUNTS_INCLUDE,
      },
    });
    return serializeSermon(sermon);
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
              include: {
                Member: {
                  select: {
                    firstName: true,
                    lastName: true,
                    photoUrl: true,
                  },
                },
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

  async getEpisodeBySermonId(sermonId: string, episodeId: string) {
    const sermon = await this.prisma.sermon.findFirst({
      where: { id: sermonId, tenantId: this.tenantId },
      include: { Episodes: { orderBy: { order: 'asc' } } },
    });

    if (!sermon) {
      throw new NotFoundException('Sermon not found');
    }

    const episode = sermon.Episodes.find((item) => item.id === episodeId);
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    return serializeEpisode(episode);
  }

  async getEpisodeBySlug(slug: string, episodeId: string) {
    const sermon = await this.prisma.sermon.findFirst({
      where: { slug, tenantId: this.tenantId },
      include: { Episodes: { orderBy: { order: 'asc' } } },
    });

    if (!sermon) {
      throw new NotFoundException('Sermon not found');
    }

    const episode = sermon.Episodes.find((item) => item.id === episodeId);
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    return serializeEpisode(episode);
  }

  async incrementPlayCount(id: string) {
    return this.prisma.sermon.update({
      where: { id },
      data: { playCount: { increment: 1 }, updatedAt: new Date() },
    });
  }

  async getSermonAnalytics() {
    const [sermons, totalSubscribers, totalReactions, totalBookmarks, totalListens] = await Promise.all([
      this.prisma.sermon.findMany({
        where: { tenantId: this.tenantId, status: SermonStatus.PUBLISHED },
        orderBy: { playCount: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          speaker: true,
          date: true,
          playCount: true,
          series: true,
          _count: { select: { SermonReaction: true, SermonBookmark: true } },
        },
      }),
      this.prisma.emailSubscriber.count({ where: { tenantId: this.tenantId } }),
      this.prisma.sermonReaction.count({ where: { tenantId: this.tenantId } }),
      this.prisma.sermonBookmark.count({ where: { tenantId: this.tenantId } }),
      this.prisma.listenProgress.count({ where: { tenantId: this.tenantId, positionSec: { gt: 0 } } }),
    ]);

    return { sermons, totalSubscribers, totalReactions, totalBookmarks, totalListens };
  }

  async getAdminSermonOverview() {
    const [
      totalSermons,
      totalSeries,
      totalSingle,
      totalDrafted,
      totalPublished,
    ] = await this.prisma.$transaction([
      this.prisma.sermon.count({ where: { tenantId: this.tenantId } }),
      this.prisma.sermon.count({ where: { tenantId: this.tenantId, type: SermonType.SERIES } }),
      this.prisma.sermon.count({ where: { tenantId: this.tenantId, type: SermonType.SINGLE } }),
      this.prisma.sermon.count({ where: { tenantId: this.tenantId, status: SermonStatus.DRAFT } }),
      this.prisma.sermon.count({ where: { tenantId: this.tenantId, status: SermonStatus.PUBLISHED } }),
    ]);

    return {
      totalSermons,
      totalSeries,
      totalSingle,
      totalDrafted,
      totalPublished,
    };
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

  async getMemberContext(userId: string, sermonId: string) {
    const member = await this.getMemberByUserId(userId);
    if (!member) {
      return null;
    }

    const [reaction, bookmark, note, progress] = await Promise.all([
      this.prisma.sermonReaction.findUnique({ where: { sermonId_memberId: { sermonId, memberId: member.id } } }),
      this.prisma.sermonBookmark.findUnique({ where: { sermonId_memberId: { sermonId, memberId: member.id } } }),
      this.prisma.sermonNote.findUnique({ where: { sermonId_memberId: { sermonId, memberId: member.id } } }),
      this.prisma.listenProgress.findUnique({ where: { sermonId_memberId: { sermonId, memberId: member.id } } }),
    ]);

    return { memberId: member.id, reaction, bookmark, note, progress };
  }

  async upsertReaction(memberId: string, sermonId: string, type: string) {
    const existing = await this.prisma.sermonReaction.findUnique({
      where: { sermonId_memberId: { sermonId, memberId } },
    });

    if (existing?.type === type) {
      await this.prisma.sermonReaction.delete({ where: { sermonId_memberId: { sermonId, memberId } } });
      return null;
    }

    return this.prisma.sermonReaction.upsert({
      where: { sermonId_memberId: { sermonId, memberId } },
      create: { id: randomUUID(), tenantId: this.tenantId, sermonId, memberId, type },
      update: { type },
    });
  }

  async toggleBookmark(memberId: string, sermonId: string) {
    const existing = await this.prisma.sermonBookmark.findUnique({
      where: { sermonId_memberId: { sermonId, memberId } },
    });

    if (existing) {
      await this.prisma.sermonBookmark.delete({ where: { sermonId_memberId: { sermonId, memberId } } });
      return false;
    }

    await this.prisma.sermonBookmark.create({ data: { id: randomUUID(), tenantId: this.tenantId, sermonId, memberId } });
    return true;
  }

  async upsertNote(memberId: string, sermonId: string, content: string) {
    return this.prisma.sermonNote.upsert({
      where: { sermonId_memberId: { sermonId, memberId } },
      create: { id: randomUUID(), tenantId: this.tenantId, sermonId, memberId, content, updatedAt: new Date() },
      update: { content, updatedAt: new Date() },
    });
  }

  async saveProgress(memberId: string, sermonId: string, positionSec: number, completed = false) {
    return this.prisma.listenProgress.upsert({
      where: { sermonId_memberId: { sermonId, memberId } },
      create: {
        id: randomUUID(),
        tenantId: this.tenantId,
        sermonId,
        memberId,
        positionSec,
        completed,
        updatedAt: new Date(),
      },
      update: { positionSec, completed, updatedAt: new Date() },
    });
  }

  async getMemberBookmarks(userId: string) {
    const member = await this.getMemberByUserId(userId);
    if (!member) {
      return [];
    }

    return this.prisma.sermonBookmark.findMany({
      where: { memberId: member.id },
      include: { Sermon: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMemberListenHistory(userId: string) {
    const member = await this.getMemberByUserId(userId);
    if (!member) {
      return [];
    }

    return this.prisma.listenProgress.findMany({
      where: { memberId: member.id, positionSec: { gt: 0 } },
      include: { Sermon: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });
  }

  async getSermonStreak(userId: string): Promise<number> {
    const member = await this.getMemberByUserId(userId);
    if (!member) {
      return 0;
    }

    const progress = await this.prisma.listenProgress.findMany({
      where: { memberId: member.id, completed: true },
      include: { Sermon: { select: { date: true } } },
      orderBy: { Sermon: { date: 'desc' } },
    });

    if (!progress.length) {
      return 0;
    }

    const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
    const weekStarts = new Set<number>();

    for (const item of progress) {
      const sermonDate = new Date(item.Sermon.date);
      sermonDate.setHours(0, 0, 0, 0);
      const weekStart = new Date(sermonDate.getTime() - sermonDate.getDay() * 86400000);
      weekStarts.add(weekStart.getTime());
    }

    const sorted = Array.from(weekStarts).sort((a, b) => b - a);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentWeekStart = new Date(now.getTime() - now.getDay() * 86400000);

    if (sorted[0] < currentWeekStart.getTime() - MS_PER_WEEK) {
      return 0;
    }

    let streak = 1;
    for (let index = 1; index < sorted.length; index += 1) {
      if (sorted[index - 1] - sorted[index] === MS_PER_WEEK) {
        streak += 1;
      } else {
        break;
      }
    }

    return streak;
  }
}
