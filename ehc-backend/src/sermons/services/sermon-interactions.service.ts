import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { SermonMemberLookupService } from './sermon-member-lookup.service';

/** A signed-in member's reaction/bookmark/note/progress on a sermon, and reflection responses. */
@Injectable()
export class SermonInteractionsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly memberLookup: SermonMemberLookupService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getMemberContext(userId: string, sermonId: string) {
    const member = await this.memberLookup.getMemberByUserId(userId);
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

  /** One response per member per reflection question — re-submitting edits the existing answer. */
  async upsertDiscussionResponse(memberId: string, questionId: string, content: string) {
    const question = await this.prisma.discussionQuestion.findFirst({
      where: { id: questionId, tenantId: this.tenantId },
    });
    if (!question) {
      throw new NotFoundException('Reflection question not found');
    }

    return this.prisma.discussionResponse.upsert({
      where: { questionId_memberId: { questionId, memberId } },
      create: { id: randomUUID(), tenantId: this.tenantId, questionId, memberId, content },
      update: { content },
      include: {
        Member: { select: { firstName: true, lastName: true, photoUrl: true } },
      },
    });
  }
}
