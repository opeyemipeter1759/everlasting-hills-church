import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import type { CreateUnitTaskCommentDto } from '../dto/unit-task-comment.dto';
import { UnitsMembershipService } from './units-membership.service';

type PersonLike = { id: string; Member: { firstName: string; lastName: string; photoUrl: string | null } | null } | null;

const PERSON_SELECT = { id: true, Member: { select: { firstName: true, lastName: true, photoUrl: true } } } as const;

/** Discussion thread on a UnitTask — any member of the unit can comment, not
 * just the lead or the assignee (mirrors ReportComment's open-thread model). */
@Injectable()
export class UnitTaskCommentsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: UnitsMembershipService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private personLabel(p: PersonLike) {
    if (!p) return null;
    const m = p.Member;
    return { profileId: p.id, name: m ? `${m.firstName} ${m.lastName}`.trim() : 'Unknown', photoUrl: m?.photoUrl ?? null };
  }

  private async assertTaskInUnit(unitId: string, taskId: string) {
    const task = await this.prisma.unitTask.findFirst({
      where: { id: taskId, unitId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!task) throw new NotFoundException('Task not found');
  }

  async list(actor: AuthUser, unitId: string, taskId: string) {
    await this.membership.assertIsUnitMember(actor, unitId);
    await this.assertTaskInUnit(unitId, taskId);

    const comments = await this.prisma.unitTaskComment.findMany({
      where: { taskId, tenantId: this.tenantId },
      orderBy: { createdAt: 'asc' },
      include: { Author: { select: PERSON_SELECT } },
    });

    return comments.map((c) => ({
      id: c.id,
      content: c.content,
      author: this.personLabel(c.Author),
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async create(actor: AuthUser, unitId: string, taskId: string, dto: CreateUnitTaskCommentDto) {
    await this.membership.assertIsUnitMember(actor, unitId);
    await this.assertTaskInUnit(unitId, taskId);

    const comment = await this.prisma.unitTaskComment.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        taskId,
        authorId: actor.profileId!,
        content: dto.content.trim(),
      },
      include: { Author: { select: PERSON_SELECT } },
    });

    return {
      id: comment.id,
      content: comment.content,
      author: this.personLabel(comment.Author),
      createdAt: comment.createdAt.toISOString(),
    };
  }
}
