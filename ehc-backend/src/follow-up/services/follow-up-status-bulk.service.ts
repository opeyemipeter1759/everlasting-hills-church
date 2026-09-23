import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { FollowUpStatusService } from './follow-up-status.service';

interface Subject {
  subjectKind: string;
  subjectId: string;
  fromStatus: string;
}

/**
 * Setting several people's status in one go.
 *
 * Only the Follow Up unit's lead or a head of department may do this, and
 * because their own changes are final anyway, these are written as already
 * approved rather than queued for someone to wave through afterwards.
 */
@Injectable()
export class FollowUpStatusBulkService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly status: FollowUpStatusService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async apply(
    actor: AuthUser,
    input: { subjects: Subject[]; toStatus: string; note?: string },
  ): Promise<{ changed: number }> {
    if (!actor.profileId) throw new ForbiddenException('No profile linked to this account');
    if (!(await this.status.canDecide(actor))) {
      throw new ForbiddenException('Only a unit lead or head of department can change several people at once');
    }

    // Somebody already on that status needs no record of becoming it.
    const changing = input.subjects.filter((s) => s.fromStatus !== input.toStatus);
    if (changing.length === 0) return { changed: 0 };

    const decidedAt = new Date();
    const by = actor.profileId;
    await this.prisma.followUpStatusChange.createMany({
      data: changing.map((subject) => ({
        id: randomUUID(),
        tenantId: this.tenantId,
        subjectKind: subject.subjectKind,
        subjectId: subject.subjectId,
        fromStatus: subject.fromStatus,
        toStatus: input.toStatus,
        note: input.note,
        requestedById: by,
        state: 'APPROVED',
        decidedById: by,
        decidedAt,
      })),
    });
    return { changed: changing.length };
  }
}
