import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import type { SendUnitMessageDto } from '../dto/unit-message.dto';
import { InboxService } from '../../inbox/inbox.service';
import { UnitsMembershipService } from './units-membership.service';

/** Handles direct member-to-member conversations inside a unit. */
@Injectable()
export class UnitMessagesService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: UnitsMembershipService,
    private readonly inbox: InboxService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async sendMessage(actor: AuthUser, unitId: string, dto: SendUnitMessageDto) {
    await this.membership.assertIsUnitMember(actor, unitId);
    if (!actor.memberId) throw new BadRequestException('A member account is required to send messages');

    if (dto.recipientId === actor.memberId) {
      throw new BadRequestException("You can't message yourself");
    }

    const [unit, recipient, sender] = await Promise.all([
      this.prisma.unit.findFirst({ where: { id: unitId, tenantId: this.tenantId }, select: { name: true } }),
      this.prisma.unitMember.findFirst({
        where: { unitId, memberId: dto.recipientId, tenantId: this.tenantId },
        select: { Member: { select: { profileId: true } } },
      }),
      actor.memberId
        ? this.prisma.member.findUnique({
            where: { id: actor.memberId },
            select: { firstName: true, lastName: true },
          })
        : null,
    ]);
    if (!unit) throw new NotFoundException('Unit not found');
    if (!recipient) throw new NotFoundException('Recipient is not a member of this unit');

    if (dto.replyToId) {
      const replyTarget = await this.prisma.unitMessage.findFirst({
        where: { id: dto.replyToId, tenantId: this.tenantId, unitId },
        select: { id: true },
      });
      if (!replyTarget) throw new NotFoundException('The message you are replying to was not found');
    }

    const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'A unit member';

    const message = await this.prisma.unitMessage.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        unitId,
        senderId: actor.memberId,
        recipientId: dto.recipientId,
        content: dto.message.trim(),
        replyToId: dto.replyToId,
      },
    });

    await this.inbox.createMany([
      {
        tenantId: this.tenantId,
        profileId: recipient.Member.profileId,
        title: `Message from ${senderName} · ${unit.name}`,
        body: dto.message.trim(),
        type: 'unit_message',
        link: `/dashboard/unit/${unitId}`,
      },
    ]);

    return { sent: true, message: { ...message, isMine: true, isRead: false } };
  }

  async getConversation(actor: AuthUser, unitId: string, recipientId: string) {
    await this.membership.assertIsUnitMember(actor, unitId);
    if (!actor.memberId) throw new BadRequestException('A member account is required to view messages');
    if (recipientId === actor.memberId) throw new BadRequestException("You can't message yourself");

    const recipient = await this.prisma.unitMember.findFirst({
      where: { unitId, memberId: recipientId, tenantId: this.tenantId },
      select: { memberId: true },
    });
    if (!recipient) throw new NotFoundException('Recipient is not a member of this unit');

    const messages = await this.prisma.unitMessage.findMany({
      where: {
        tenantId: this.tenantId,
        unitId,
        OR: [
          { senderId: actor.memberId, recipientId },
          { senderId: recipientId, recipientId: actor.memberId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        senderId: true,
        recipientId: true,
        createdAt: true,
        readAt: true,
        editedAt: true,
        deletedAt: true,
        replyToId: true,
        ReplyTo: { select: { id: true, content: true, senderId: true, deletedAt: true } },
      },
    });

    return messages.map((item) => ({
      ...item,
      isMine: item.senderId === actor.memberId,
      isRead: item.senderId === actor.memberId && Boolean(item.readAt),
    }));
  }

  async getUnreadCounts(actor: AuthUser, unitId: string) {
    await this.membership.assertIsUnitMember(actor, unitId);
    if (!actor.memberId) throw new BadRequestException('A member account is required to view messages');
    const messages = await this.prisma.unitMessage.groupBy({
      by: ['senderId'],
      where: { tenantId: this.tenantId, unitId, recipientId: actor.memberId, readAt: null, deletedAt: null },
      _count: { _all: true },
    });
    return messages.reduce<Record<string, number>>((counts, item) => {
      counts[item.senderId] = item._count._all;
      return counts;
    }, {});
  }

  async markConversationRead(actor: AuthUser, unitId: string, recipientId: string) {
    await this.membership.assertIsUnitMember(actor, unitId);
    if (!actor.memberId) throw new BadRequestException('A member account is required to update messages');
    await this.prisma.unitMessage.updateMany({
      where: { tenantId: this.tenantId, unitId, senderId: recipientId, recipientId: actor.memberId, readAt: null },
      data: { readAt: new Date() },
    });
    return { read: true };
  }

  async updateMessage(actor: AuthUser, unitId: string, messageId: string, content: string) {
    await this.membership.assertIsUnitMember(actor, unitId);
    if (!actor.memberId) throw new BadRequestException('A member account is required to edit messages');
    const message = await this.prisma.unitMessage.findFirst({ where: { id: messageId, unitId, tenantId: this.tenantId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== actor.memberId) throw new BadRequestException('You can only edit your own messages');
    if (message.deletedAt) throw new BadRequestException('Deleted messages cannot be edited');
    if (!content.trim()) throw new BadRequestException('Message cannot be empty');
    return this.prisma.unitMessage.update({ where: { id: messageId }, data: { content: content.trim(), editedAt: new Date() } });
  }

  async deleteMessage(actor: AuthUser, unitId: string, messageId: string) {
    await this.membership.assertIsUnitMember(actor, unitId);
    if (!actor.memberId) throw new BadRequestException('A member account is required to delete messages');
    const message = await this.prisma.unitMessage.findFirst({ where: { id: messageId, unitId, tenantId: this.tenantId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== actor.memberId) throw new BadRequestException('You can only delete your own messages');
    return this.prisma.unitMessage.update({ where: { id: messageId }, data: { content: '', deletedAt: new Date() } });
  }
}
