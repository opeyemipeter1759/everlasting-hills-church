import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { personName } from './master-list.util';
import { FollowUpStatusService } from './follow-up-status.service';

export interface PendingStatusChange {
  id: string;
  subjectKind: string;
  subjectId: string;
  name: string;
  fromStatus: string;
  toStatus: string;
  note: string | null;
  requestedBy: string;
  requestedAt: string;
}

/**
 * Status changes still waiting on a unit lead or head of department — what the
 * Pending tab shows. Names are resolved here so the list reads as people
 * rather than ids.
 */
@Injectable()
export class FollowUpStatusPendingService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly status: FollowUpStatusService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async list(actor: AuthUser): Promise<PendingStatusChange[]> {
    if (!(await this.status.canDecide(actor))) {
      throw new ForbiddenException('Only a unit lead or head of department can see this');
    }

    const rows = await this.prisma.followUpStatusChange.findMany({
      where: { tenantId: this.tenantId, state: 'PENDING' },
      orderBy: { requestedAt: 'asc' },
    });
    if (rows.length === 0) return [];

    const [members, visitors, requesters] = await Promise.all([
      this.prisma.member.findMany({
        where: { id: { in: rows.filter((r) => r.subjectKind === 'MEMBER').map((r) => r.subjectId) } },
        select: { id: true, firstName: true, lastName: true },
      }),
      this.prisma.visitor.findMany({
        where: { id: { in: rows.filter((r) => r.subjectKind === 'VISITOR').map((r) => r.subjectId) } },
        select: { id: true, firstName: true, lastName: true },
      }),
      this.prisma.member.findMany({
        where: { profileId: { in: rows.map((r) => r.requestedById) } },
        select: { profileId: true, firstName: true, lastName: true },
      }),
    ]);

    const nameById = new Map<string, string>([
      ...members.map((m) => [m.id, personName(m)] as const),
      ...visitors.map((v) => [v.id, personName(v)] as const),
    ]);
    const requesterByProfile = new Map(requesters.map((r) => [r.profileId, personName(r)]));

    return rows.map((row) => ({
      id: row.id,
      subjectKind: row.subjectKind,
      subjectId: row.subjectId,
      name: nameById.get(row.subjectId) ?? 'Unknown',
      fromStatus: row.fromStatus,
      toStatus: row.toStatus,
      note: row.note,
      requestedBy: requesterByProfile.get(row.requestedById) ?? 'A team member',
      requestedAt: row.requestedAt.toISOString(),
    }));
  }
}
