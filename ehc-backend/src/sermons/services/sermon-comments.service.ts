import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

@Injectable()
export class SermonCommentsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * Flat list of comments for a sermon, newest top-level first with replies nested
   * underneath (oldest reply first, so a thread reads top-to-bottom).
   */
  async getComments(sermonId: string) {
    const comments = await this.prisma.sermonComment.findMany({
      where: { sermonId, tenantId: this.tenantId },
      orderBy: { createdAt: 'asc' },
      include: {
        Member: { select: { firstName: true, lastName: true, photoUrl: true } },
      },
    });

    const byParent = new Map<string | null, typeof comments>();
    for (const comment of comments) {
      const key = comment.parentId;
      byParent.set(key, [...(byParent.get(key) ?? []), comment]);
    }

    const serialize = (comment: (typeof comments)[number]) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      memberId: comment.memberId,
      member: comment.Member,
      replies: (byParent.get(comment.id) ?? []).map(serialize),
    });

    // Chronological, oldest first — like a normal chat feed. New comments
    // should land at the bottom, not jump to the top.
    return (byParent.get(null) ?? []).map(serialize);
  }

  async createComment(memberId: string, sermonId: string, content: string, parentId?: string) {
    const sermon = await this.prisma.sermon.findFirst({ where: { id: sermonId, tenantId: this.tenantId } });
    if (!sermon) {
      throw new NotFoundException('Sermon not found');
    }

    if (parentId) {
      const parent = await this.prisma.sermonComment.findFirst({
        where: { id: parentId, sermonId, tenantId: this.tenantId },
      });
      if (!parent) {
        throw new NotFoundException('Comment being replied to was not found');
      }
    }

    return this.prisma.sermonComment.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        sermonId,
        memberId,
        parentId: parentId ?? null,
        content,
        updatedAt: new Date(),
      },
      include: {
        Member: { select: { firstName: true, lastName: true, photoUrl: true } },
      },
    });
  }

  /** Author or a PASTOR may delete a comment. Deleting a parent cascades to its replies. */
  async deleteComment(commentId: string, requester: { memberId: string; isPastor: boolean }) {
    const comment = await this.prisma.sermonComment.findFirst({
      where: { id: commentId, tenantId: this.tenantId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.memberId !== requester.memberId && !requester.isPastor) {
      throw new BadRequestException('You can only delete your own comments');
    }

    await this.prisma.sermonComment.deleteMany({
      where: { OR: [{ id: commentId }, { parentId: commentId }], tenantId: this.tenantId },
    });
    return { id: commentId, deleted: true };
  }
}
