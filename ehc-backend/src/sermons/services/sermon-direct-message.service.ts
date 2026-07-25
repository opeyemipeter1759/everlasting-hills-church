import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { InboxService } from '../../inbox/inbox.service';
import type { Env } from '../../config/env.validation';
import type { DirectMessageType } from '../dto/sermon-interaction.dto';

/**
 * Sends a private note/question about a sermon to exactly one other member and drops a
 * notification in their inbox (read by the dashboard bell) linking back to the sermon.
 */
@Injectable()
export class SermonDirectMessageService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inbox: InboxService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async sendDirectMessage(
    senderId: string,
    sermonId: string,
    input: { recipientMemberId: string; type: DirectMessageType; content: string; parentId?: string },
  ) {
    if (input.recipientMemberId === senderId) {
      throw new BadRequestException('You cannot send a message to yourself');
    }

    const [sermon, recipient] = await Promise.all([
      this.prisma.sermon.findFirst({ where: { id: sermonId, tenantId: this.tenantId } }),
      this.prisma.member.findFirst({ where: { id: input.recipientMemberId, tenantId: this.tenantId } }),
    ]);
    if (!sermon) throw new NotFoundException('Sermon not found');
    if (!recipient) throw new NotFoundException('Recipient not found');

    if (input.parentId) {
      const parent = await this.prisma.sermonDirectMessage.findFirst({
        where: { id: input.parentId, sermonId, tenantId: this.tenantId },
      });
      if (!parent) throw new NotFoundException('Message being replied to was not found');
    }

    const message = await this.prisma.sermonDirectMessage.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        sermonId,
        senderId,
        recipientId: input.recipientMemberId,
        type: input.type,
        content: input.content,
        parentId: input.parentId ?? null,
      },
      include: {
        Sender: { select: { firstName: true, lastName: true, photoUrl: true } },
        Recipient: { select: { firstName: true, lastName: true, photoUrl: true } },
      },
    });

    const sender = await this.prisma.member.findUnique({ where: { id: senderId } });
    await this.inbox.createMany([
      {
        tenantId: this.tenantId,
        profileId: recipient.profileId,
        type: 'sermon_direct_message',
        title: input.type === 'QUESTION' ? 'New question about a sermon' : 'Someone shared a note with you',
        body: `${sender?.firstName ?? 'A member'} ${input.parentId ? 'replied' : input.type === 'QUESTION' ? 'asked you about' : 'shared a note on'} "${sermon.title}"`,
        link: `/dashboard/sermon/${sermon.slug}`,
      },
    ]);

    return message;
  }

  /** Everything I've sent or received for this sermon — threaded, oldest first per thread. */
  async getSermonDirectMessages(memberId: string, sermonId: string) {
    const messages = await this.prisma.sermonDirectMessage.findMany({
      where: { sermonId, tenantId: this.tenantId, OR: [{ senderId: memberId }, { recipientId: memberId }] },
      orderBy: { createdAt: 'asc' },
      include: {
        Sender: { select: { firstName: true, lastName: true, photoUrl: true } },
        Recipient: { select: { firstName: true, lastName: true, photoUrl: true } },
      },
    });

    const byParent = new Map<string | null, typeof messages>();
    for (const m of messages) {
      const key = m.parentId;
      byParent.set(key, [...(byParent.get(key) ?? []), m]);
    }

    const serialize = (m: (typeof messages)[number]) => ({
      id: m.id,
      type: m.type,
      content: m.content,
      createdAt: m.createdAt,
      senderId: m.senderId,
      recipientId: m.recipientId,
      sender: m.Sender,
      recipient: m.Recipient,
      replies: (byParent.get(m.id) ?? []).map(serialize),
    });

    return (byParent.get(null) ?? []).reverse().map(serialize);
  }
}
