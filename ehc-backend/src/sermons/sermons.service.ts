import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, SermonStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import slugify from 'slugify';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';

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
    return this.prisma.sermon.findMany({
      where: {
        tenantId: this.tenantId,
        ...(opts?.status && { status: opts.status }),
        ...(opts?.series && { seriesSlug: opts.series }),
      },
      orderBy: { date: 'desc' },
      include: {
        _count: { select: { SermonReaction: true, SermonBookmark: true } },
      },
    });
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
        _count: { select: { SermonReaction: true, SermonBookmark: true } },
      },
    });

    if (!sermon) {
      throw new NotFoundException('Sermon not found');
    }

    return sermon;
  }

  async createSermon(data: {
    title: string;
    speaker: string;
    date: string;
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
    const slug = makeSlug(data.title, data.date);
    return this.prisma.sermon.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        title: data.title,
        slug,
        speaker: data.speaker,
        date: new Date(data.date),
        description: data.description ?? null,
        transcript: data.transcript ?? null,
        scriptureRef: data.scriptureRef ?? null,
        series: data.series ?? null,
        seriesSlug: data.series ? slugify(data.series, { lower: true, strict: true }) : null,
        tags: data.tags ?? [],
        audioUrl: data.audioUrl ?? null,
        audioKey: data.audioKey ?? null,
        audioDuration: data.audioDuration ?? null,
        videoUrl: data.videoUrl ?? null,
        thumbnailUrl: data.thumbnailUrl ?? null,
        status: data.status ?? SermonStatus.DRAFT,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        publishedAt: data.status === SermonStatus.PUBLISHED ? new Date() : null,
        updatedAt: new Date(),
      },
    });
  }

  async updateSermon(
    id: string,
    data: Partial<{
      title: string;
      speaker: string;
      date: string;
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

    const nowPublishing =
      data.status === SermonStatus.PUBLISHED && current.status !== SermonStatus.PUBLISHED;

    return this.prisma.sermon.update({
      where: { id },
      data: {
        ...(data.title && {
          title: data.title,
          slug: makeSlug(data.title, data.date ?? current.date),
        }),
        ...(data.speaker && { speaker: data.speaker }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.transcript !== undefined && { transcript: data.transcript }),
        ...(data.scriptureRef !== undefined && { scriptureRef: data.scriptureRef }),
        ...(data.series !== undefined && {
          series: data.series,
          seriesSlug: data.series ? slugify(data.series, { lower: true, strict: true }) : null,
        }),
        ...(data.tags && { tags: data.tags }),
        ...(data.audioUrl !== undefined && { audioUrl: data.audioUrl }),
        ...(data.audioKey !== undefined && { audioKey: data.audioKey }),
        ...(data.audioDuration !== undefined && { audioDuration: data.audioDuration }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        ...(data.status && { status: data.status }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.scheduledFor !== undefined && {
          scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        }),
        ...(nowPublishing && { publishedAt: new Date() }),
        updatedAt: new Date(),
      },
    });
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
    return this.prisma.sermon.update({
      where: { id },
      data: { isFeatured: true, updatedAt: new Date() },
    });
  }

  async getPublishedSermons(opts?: { series?: string; search?: string; limit?: number }) {
    return this.prisma.sermon.findMany({
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
        _count: { select: { SermonReaction: true, SermonBookmark: true } },
      },
    });
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
        _count: { select: { SermonReaction: true, SermonBookmark: true } },
      },
    });

    if (!sermon) {
      throw new NotFoundException('Sermon not found');
    }

    return sermon;
  }

  async getFeaturedSermon() {
    return this.prisma.sermon.findFirst({
      where: { tenantId: this.tenantId, status: SermonStatus.PUBLISHED, isFeatured: true },
    });
  }

  async getLatestSermons(limit = 3) {
    return this.prisma.sermon.findMany({
      where: { tenantId: this.tenantId, status: SermonStatus.PUBLISHED },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async getSeriesList() {
    const sermons = await this.prisma.sermon.findMany({
      where: { tenantId: this.tenantId, status: SermonStatus.PUBLISHED, series: { not: null } },
      select: { series: true, seriesSlug: true, date: true },
      distinct: ['seriesSlug'],
      orderBy: { date: 'desc' },
    });
    return sermons.filter((s) => s.series && s.seriesSlug);
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
