import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FollowUpStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { personName } from './master-list.util';
import { FollowUpStatusService } from './follow-up-status.service';

export interface AssigneeLoad {
  memberId: string;
  name: string;
  photoUrl: string | null;
  /** People currently on their plate. */
  count: number;
}

/**
 * How the follow-up work is spread across the team — who is carrying how many.
 *
 * For the unit's lead and the head of department: it answers "who has too
 * much?" and gives the Master List a way to show one person's caseload. Only
 * they see it, because it names how hard each person is working.
 */
@Injectable()
export class FollowUpWorkloadService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly status: FollowUpStatusService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async byAssignee(actor: AuthUser): Promise<AssigneeLoad[]> {
    if (!(await this.status.canDecide(actor))) {
      throw new ForbiddenException('Only a unit lead or head of department can see this');
    }

    const grouped = await this.prisma.followUpEntry.groupBy({
      by: ['assigneeId'],
      where: {
        tenantId: this.tenantId,
        assigneeId: { not: null },
        stage: { not: FollowUpStage.CONFIRMED },
      },
      _count: { _all: true },
    });
    if (grouped.length === 0) return [];

    const members = await this.prisma.member.findMany({
      where: { id: { in: grouped.map((row) => row.assigneeId as string) } },
      select: { id: true, firstName: true, lastName: true, photoUrl: true },
    });
    const byId = new Map(members.map((m) => [m.id, m]));

    return grouped
      .map((row) => {
        const member = byId.get(row.assigneeId as string);
        return {
          memberId: row.assigneeId as string,
          name: member ? personName(member) : 'A team member',
          photoUrl: member?.photoUrl ?? null,
          count: row._count._all,
        };
      })
      // Heaviest first: the point of the list is spotting who is overloaded.
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }
}
