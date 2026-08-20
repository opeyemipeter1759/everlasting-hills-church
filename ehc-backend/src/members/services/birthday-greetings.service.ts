import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

@Injectable()
export class BirthdayGreetingsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async listForMember(memberId: string) {
    return this.prisma.birthdayGreeting.findMany({
      where: { memberId, tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        Author: { select: { firstName: true, lastName: true, photoUrl: true } },
      },
    });
  }

  async create(memberId: string, authorMemberId: string, message: string) {
    const recipient = await this.prisma.member.findFirst({ where: { id: memberId, tenantId: this.tenantId } });
    if (!recipient) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.birthdayGreeting.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        memberId,
        authorMemberId,
        message,
      },
      include: {
        Author: { select: { firstName: true, lastName: true, photoUrl: true } },
      },
    });
  }

  /** Author or a PASTOR may delete a greeting (moderation), same policy as SermonComment. */
  async delete(greetingId: string, requester: { memberId: string; isPastor: boolean }) {
    const greeting = await this.prisma.birthdayGreeting.findFirst({
      where: { id: greetingId, tenantId: this.tenantId },
    });
    if (!greeting) {
      throw new NotFoundException('Greeting not found');
    }
    if (greeting.authorMemberId !== requester.memberId && !requester.isPastor) {
      throw new BadRequestException('You can only delete your own greeting');
    }

    await this.prisma.birthdayGreeting.delete({ where: { id: greetingId } });
    return { id: greetingId, deleted: true };
  }
}
