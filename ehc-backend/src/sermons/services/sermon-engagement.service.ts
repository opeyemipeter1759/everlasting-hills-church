import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { SermonCommentsService } from './sermon-comments.service';

/** Full per-member engagement breakdown for one sermon — backs the pastor's sermon detail-analytics page. */
@Injectable()
export class SermonEngagementService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly comments: SermonCommentsService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getSermonEngagement(id: string) {
    const tenantId = this.tenantId;

    const sermon = await this.prisma.sermon.findFirst({
      where: { id, tenantId },
      select: { id: true, title: true, slug: true, speaker: true, date: true, playCount: true, series: true, audioDuration: true },
    });
    if (!sermon) throw new NotFoundException('Sermon not found');

    const memberSelect = { select: { firstName: true, lastName: true, photoUrl: true } } as const;

    const [reactions, bookmarks, notes, listens, discussionQuestions] = await Promise.all([
      this.prisma.sermonReaction.findMany({
        where: { sermonId: id, tenantId },
        orderBy: { createdAt: 'desc' },
        include: { Member: memberSelect },
      }),
      this.prisma.sermonBookmark.findMany({
        where: { sermonId: id, tenantId },
        orderBy: { createdAt: 'desc' },
        include: { Member: memberSelect },
      }),
      this.prisma.sermonNote.findMany({
        where: { sermonId: id, tenantId },
        orderBy: { createdAt: 'desc' },
        include: { Member: memberSelect },
      }),
      this.prisma.listenProgress.findMany({
        where: { sermonId: id, tenantId },
        orderBy: { updatedAt: 'desc' },
        include: { Member: memberSelect },
      }),
      this.prisma.discussionQuestion.findMany({
        where: { sermonId: id, tenantId },
        orderBy: { order: 'asc' },
        include: { DiscussionResponse: { orderBy: { createdAt: 'asc' }, include: { Member: memberSelect } } },
      }),
    ]);

    const comments = await this.comments.getComments(id);

    return {
      sermon,
      reactions: reactions.map((r) => ({ id: r.id, type: r.type, createdAt: r.createdAt, member: r.Member })),
      bookmarks: bookmarks.map((b) => ({ id: b.id, createdAt: b.createdAt, member: b.Member })),
      notes: notes.map((n) => ({ id: n.id, content: n.content, createdAt: n.createdAt, member: n.Member })),
      comments,
      listens: listens.map((l) => ({
        id: l.id,
        positionSec: l.positionSec,
        completed: l.completed,
        updatedAt: l.updatedAt,
        member: l.Member,
      })),
      discussion: discussionQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        order: q.order,
        responses: q.DiscussionResponse.map((r) => ({
          id: r.id,
          content: r.content,
          createdAt: r.createdAt,
          member: r.Member,
        })),
      })),
    };
  }
}
