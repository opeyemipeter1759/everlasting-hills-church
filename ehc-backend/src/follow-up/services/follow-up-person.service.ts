import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { FollowUpPerson } from './follow-up-person.types';
import { memberInclude, toMemberPerson, toVisitorPerson, visitorInclude } from './person-mapper.util';
import { FollowUpStatusService } from './follow-up-status.service';

export type { FollowUpPerson } from './follow-up-person.types';

/**
 * One person from the Master List, in full — whichever side of the line they
 * are on. A first-timer and a member are described by different tables, so
 * this reads both and the drawer shows whatever is known rather than two
 * different screens.
 */
@Injectable()
export class FollowUpPersonService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly status: FollowUpStatusService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async get(kind: string, id: string): Promise<FollowUpPerson> {
    const person = kind === 'VISITOR' ? await this.visitor(id) : await this.member(id);
    const [agreed, waiting] = await Promise.all([
      this.status.approvedFor(kind, [id]),
      this.status.pendingFor(kind, [id]),
    ]);
    return {
      ...person,
      status: agreed.get(id)?.status ?? person.status,
      statusAwaitingApproval: waiting.get(id)?.status ?? null,
    };
  }

  private async visitor(id: string): Promise<FollowUpPerson> {
    const visitor = await this.prisma.visitor.findFirst({
      where: { id, tenantId: this.tenantId },
      include: visitorInclude,
    });
    if (!visitor) throw new NotFoundException('First-timer not found');
    return toVisitorPerson(visitor);
  }

  private async member(id: string): Promise<FollowUpPerson> {
    const member = await this.prisma.member.findFirst({
      where: { id, tenantId: this.tenantId },
      include: memberInclude,
    });
    if (!member) throw new NotFoundException('Member not found');
    return toMemberPerson(member);
  }
}
