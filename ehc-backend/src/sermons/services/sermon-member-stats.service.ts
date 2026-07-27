import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SERMON_COUNTS_INCLUDE } from '../sermon-serialization.util';
import { SermonMemberLookupService } from './sermon-member-lookup.service';

/** The signed-in member's own bookmarks, listen history, aggregate stats, and weekly streak. */
@Injectable()
export class SermonMemberStatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memberLookup: SermonMemberLookupService,
  ) {}

  async getMemberBookmarks(userId: string) {
    const member = await this.memberLookup.getMemberByUserId(userId);
    if (!member) {
      return [];
    }

    return this.prisma.sermonBookmark.findMany({
      where: { memberId: member.id },
      include: { Sermon: { include: SERMON_COUNTS_INCLUDE } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMemberListenHistory(userId: string) {
    const member = await this.memberLookup.getMemberByUserId(userId);
    if (!member) {
      return [];
    }

    return this.prisma.listenProgress.findMany({
      where: { memberId: member.id, positionSec: { gt: 0 } },
      include: { Sermon: { include: SERMON_COUNTS_INCLUDE } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });
  }

  /**
   * Counted directly (not derived from the capped history list above) so "completed" and
   * "in progress" stay accurate even once a member has listened to more than the 10 most
   * recent sermons.
   */
  async getMemberSermonStats(userId: string) {
    const member = await this.memberLookup.getMemberByUserId(userId);
    if (!member) {
      return { completed: 0, inProgress: 0, bookmarked: 0 };
    }

    const [completed, inProgress, bookmarked] = await this.prisma.$transaction([
      this.prisma.listenProgress.count({ where: { memberId: member.id, completed: true } }),
      this.prisma.listenProgress.count({
        where: { memberId: member.id, completed: false, positionSec: { gt: 0 } },
      }),
      this.prisma.sermonBookmark.count({ where: { memberId: member.id } }),
    ]);

    return { completed, inProgress, bookmarked };
  }

  async getSermonStreak(userId: string): Promise<number> {
    const member = await this.memberLookup.getMemberByUserId(userId);
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
