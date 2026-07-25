import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SermonStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

@Injectable()
export class SermonAnalyticsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getSermonAnalytics() {
    const tenantId = this.tenantId;

    const [sermons, totalSubscribers, totalReactions, totalBookmarks, totalListens] = await Promise.all([
      this.prisma.sermon.findMany({
        where: { tenantId, status: SermonStatus.PUBLISHED },
        orderBy: { playCount: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          speaker: true,
          date: true,
          playCount: true,
          series: true,
          _count: {
            select: {
              SermonReaction: true,
              SermonBookmark: true,
              SermonComment: true,
              SermonNote: true,
              ListenProgress: true,
            },
          },
        },
      }),
      this.prisma.emailSubscriber.count({ where: { tenantId } }),
      this.prisma.sermonReaction.count({ where: { tenantId } }),
      this.prisma.sermonBookmark.count({ where: { tenantId } }),
      this.prisma.listenProgress.count({ where: { tenantId, positionSec: { gt: 0 } } }),
    ]);

    const sermonIds = sermons.map((s) => s.id);

    const [reactionGroups, completedGroups, discussionQuestions] = await Promise.all([
      this.prisma.sermonReaction.groupBy({
        by: ['sermonId', 'type'],
        where: { tenantId, sermonId: { in: sermonIds } },
        _count: { _all: true },
      }),
      this.prisma.listenProgress.groupBy({
        by: ['sermonId'],
        where: { tenantId, sermonId: { in: sermonIds }, completed: true },
        _count: { _all: true },
      }),
      this.prisma.discussionQuestion.findMany({
        where: { tenantId, sermonId: { in: sermonIds } },
        select: { sermonId: true, _count: { select: { DiscussionResponse: true } } },
      }),
    ]);

    const reactionsBySermon = new Map<string, { LIKE: number; AMEN: number; CONVICTED: number }>();
    for (const g of reactionGroups) {
      const entry = reactionsBySermon.get(g.sermonId) ?? { LIKE: 0, AMEN: 0, CONVICTED: 0 };
      if (g.type === 'LIKE' || g.type === 'AMEN' || g.type === 'CONVICTED') {
        entry[g.type] = g._count._all;
      }
      reactionsBySermon.set(g.sermonId, entry);
    }

    const completedBySermon = new Map<string, number>();
    for (const g of completedGroups) {
      completedBySermon.set(g.sermonId, g._count._all);
    }

    const discussionBySermon = new Map<string, { questionCount: number; responseCount: number; questionsWithResponses: number }>();
    for (const q of discussionQuestions) {
      const entry = discussionBySermon.get(q.sermonId) ?? { questionCount: 0, responseCount: 0, questionsWithResponses: 0 };
      entry.questionCount += 1;
      entry.responseCount += q._count.DiscussionResponse;
      if (q._count.DiscussionResponse > 0) entry.questionsWithResponses += 1;
      discussionBySermon.set(q.sermonId, entry);
    }

    const sermonsWithEngagement = sermons.map((s) => {
      const listens = s._count.ListenProgress;
      const completed = completedBySermon.get(s.id) ?? 0;
      return {
        ...s,
        reactionsByType: reactionsBySermon.get(s.id) ?? { LIKE: 0, AMEN: 0, CONVICTED: 0 },
        completedListens: completed,
        completionRate: listens > 0 ? completed / listens : 0,
        discussion: discussionBySermon.get(s.id) ?? { questionCount: 0, responseCount: 0, questionsWithResponses: 0 },
      };
    });

    return { sermons: sermonsWithEngagement, totalSubscribers, totalReactions, totalBookmarks, totalListens };
  }
}
