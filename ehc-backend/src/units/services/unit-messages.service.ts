import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import type { SendUnitMessageDto } from '../dto/unit-message.dto';
import { InboxService } from '../../inbox/inbox.service';
import { UnitsMembershipService } from './units-membership.service';

/** Lets any unit member message any other member of the same unit — lands as
 * an in-app notification, reusing the existing notification bell rather than
 * building a separate chat system. */
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

    const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'A unit member';

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

    return { sent: true };
  }
}
