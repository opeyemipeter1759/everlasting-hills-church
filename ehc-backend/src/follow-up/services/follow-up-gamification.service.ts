import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FollowUpConnectionStatus, FollowUpLogKind, FollowUpOutcome, FollowUpStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';

const POSITIVE_OUTCOMES: FollowUpOutcome[] = [
  FollowUpOutcome.WANT_TO_BE_MEMBER,
  FollowUpOutcome.BECAME_MEMBER,
  FollowUpOutcome.RETURNED,
];
const WINS_WINDOW_DAYS = 30;
const DUE_HOURS = 48;

export interface WinItem {
  id: string;
  type: 'CONFIRMED_OUTCOME' | 'CONNECTION_MADE';
  actorName: string;
  subjectName: string;
  message: string;
  at: string;
}

export interface LeaderboardRow {
  memberId: string;
  name: string;
  photoUrl: string | null;
  contactsLogged: number;
  connectionsMade: number;
  confirmed: number;
  score: number;
  rank: number;
}

/**
 * Everything here is computed live from the source tables — no separate "wins"
 * ledger or historical streak table. Streaks in the spec sense (N weeks
 * running with nothing overdue) would need daily snapshots we don't keep, so
 * the "all caught up" badge is a real-time overdue count instead of a
 * fabricated streak.
 */
@Injectable()
export class FollowUpGamificationService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async wins(): Promise<WinItem[]> {
    const since = new Date(Date.now() - WINS_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [confirmedEntries, connections] = await Promise.all([
      this.prisma.followUpEntry.findMany({
        where: { tenantId: this.tenantId, stage: FollowUpStage.CONFIRMED, outcome: { in: POSITIVE_OUTCOMES }, updatedAt: { gte: since } },
        select: {
          id: true,
          outcome: true,
          updatedAt: true,
          Assignee: { select: { firstName: true, lastName: true } },
          Member: { select: { firstName: true, lastName: true } },
          Visitor: { select: { firstName: true, lastName: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      this.prisma.followUpConnection.findMany({
        where: { tenantId: this.tenantId, status: FollowUpConnectionStatus.CONNECTED, updatedAt: { gte: since } },
        select: {
          id: true,
          updatedAt: true,
          IntroducedBy: { select: { firstName: true, lastName: true } },
          SuggestedMember: { select: { firstName: true, lastName: true } },
          Entry: { select: { Member: { select: { firstName: true, lastName: true } }, Visitor: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
    ]);

    const outcomeLabel: Record<string, string> = {
      WANT_TO_BE_MEMBER: 'wants to become a member',
      BECAME_MEMBER: 'became a member',
      RETURNED: 'came back',
    };

    const wins: WinItem[] = [];
    for (const e of confirmedEntries) {
      const subject = e.Member ?? e.Visitor;
      if (!subject) continue;
      const subjectName = `${subject.firstName} ${subject.lastName}`.trim();
      const actorName = e.Assignee ? `${e.Assignee.firstName} ${e.Assignee.lastName}`.trim() : 'The team';
      wins.push({
        id: `entry-${e.id}`,
        type: 'CONFIRMED_OUTCOME',
        actorName,
        subjectName,
        message: `${subjectName} ${outcomeLabel[e.outcome as string] ?? 'was followed up with'} — ${actorName} made it happen.`,
        at: e.updatedAt.toISOString(),
      });
    }
    for (const c of connections) {
      const entrySubject = c.Entry.Member ?? c.Entry.Visitor;
      if (!entrySubject || !c.IntroducedBy) continue;
      const subjectName = `${entrySubject.firstName} ${entrySubject.lastName}`.trim();
      const friendName = `${c.SuggestedMember.firstName} ${c.SuggestedMember.lastName}`.trim();
      const actorName = `${c.IntroducedBy.firstName} ${c.IntroducedBy.lastName}`.trim();
      wins.push({
        id: `connection-${c.id}`,
        type: 'CONNECTION_MADE',
        actorName,
        subjectName,
        message: `${subjectName} made a new friend in ${friendName} — introduced by ${actorName}.`,
        at: c.updatedAt.toISOString(),
      });
    }

    return wins.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 50);
  }

  async leaderboard(period: 'week' | 'month'): Promise<{ top: LeaderboardRow[]; viewer: LeaderboardRow | null; overdueCount: number }> {
    const days = period === 'week' ? 7 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [contactGroups, connectionGroups, confirmedGroups] = await Promise.all([
      this.prisma.followUpContactLog.groupBy({
        by: ['byId'],
        where: { tenantId: this.tenantId, kind: FollowUpLogKind.CONTACT, createdAt: { gte: since } },
        _count: { _all: true },
      }),
      this.prisma.followUpConnection.groupBy({
        by: ['introducedById'],
        where: { tenantId: this.tenantId, status: FollowUpConnectionStatus.CONNECTED, updatedAt: { gte: since }, introducedById: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.followUpEntry.groupBy({
        by: ['assigneeId'],
        where: { tenantId: this.tenantId, outcome: { in: POSITIVE_OUTCOMES }, updatedAt: { gte: since }, assigneeId: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const byMember = new Map<string, { contactsLogged: number; connectionsMade: number; confirmed: number }>();
    const bump = (id: string | null, key: 'contactsLogged' | 'connectionsMade' | 'confirmed', n: number) => {
      if (!id) return;
      const row = byMember.get(id) ?? { contactsLogged: 0, connectionsMade: 0, confirmed: 0 };
      row[key] += n;
      byMember.set(id, row);
    };
    contactGroups.forEach((g) => bump(g.byId, 'contactsLogged', g._count._all));
    connectionGroups.forEach((g) => bump(g.introducedById, 'connectionsMade', g._count._all));
    confirmedGroups.forEach((g) => bump(g.assigneeId, 'confirmed', g._count._all));

    const memberIds = Array.from(byMember.keys());
    const members = memberIds.length
      ? await this.prisma.member.findMany({ where: { id: { in: memberIds } }, select: { id: true, firstName: true, lastName: true, photoUrl: true } })
      : [];
    const memberById = new Map(members.map((m) => [m.id, m]));

    const rows: Omit<LeaderboardRow, 'rank'>[] = memberIds
      .map((id) => {
        const stats = byMember.get(id)!;
        const m = memberById.get(id);
        return {
          memberId: id,
          name: m ? `${m.firstName} ${m.lastName}`.trim() : 'Unknown',
          photoUrl: m?.photoUrl ?? null,
          ...stats,
          score: stats.contactsLogged + stats.connectionsMade * 3 + stats.confirmed * 5,
        };
      })
      .sort((a, b) => b.score - a.score);

    const ranked: LeaderboardRow[] = rows.map((r, i) => ({ ...r, rank: i + 1 }));
    return { top: ranked.slice(0, 10), viewer: null, overdueCount: 0 };
  }

  /** Attaches the caller's own rank + overdue count to a leaderboard result. */
  async withViewer(actor: AuthUser, result: { top: LeaderboardRow[]; viewer: LeaderboardRow | null; overdueCount: number }, period: 'week' | 'month') {
    if (!actor.memberId) return result;

    const days = period === 'week' ? 7 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [contacts, connections, confirmed, overdueCount] = await Promise.all([
      this.prisma.followUpContactLog.count({ where: { tenantId: this.tenantId, byId: actor.memberId, kind: FollowUpLogKind.CONTACT, createdAt: { gte: since } } }),
      this.prisma.followUpConnection.count({ where: { tenantId: this.tenantId, introducedById: actor.memberId, status: FollowUpConnectionStatus.CONNECTED, updatedAt: { gte: since } } }),
      this.prisma.followUpEntry.count({ where: { tenantId: this.tenantId, assigneeId: actor.memberId, outcome: { in: POSITIVE_OUTCOMES }, updatedAt: { gte: since } } }),
      this.countOverdue(actor.memberId),
    ]);

    const existingRank = result.top.find((r) => r.memberId === actor.memberId);
    const viewer: LeaderboardRow = existingRank ?? {
      memberId: actor.memberId,
      name: 'You',
      photoUrl: null,
      contactsLogged: contacts,
      connectionsMade: connections,
      confirmed,
      score: contacts + connections * 3 + confirmed * 5,
      rank: 0,
    };
    return { ...result, viewer, overdueCount };
  }

  private async countOverdue(memberId: string): Promise<number> {
    const cutoff = new Date(Date.now() - DUE_HOURS * 60 * 60 * 1000);
    return this.prisma.followUpEntry.count({
      where: {
        tenantId: this.tenantId,
        assigneeId: memberId,
        stage: { not: FollowUpStage.CONFIRMED },
        OR: [{ snoozedUntil: null }, { snoozedUntil: { lt: new Date() } }],
        AND: [
          {
            OR: [
              { lastContactAt: { lt: cutoff } },
              { lastContactAt: null, createdAt: { lt: cutoff } },
            ],
          },
        ],
      },
    });
  }
}
