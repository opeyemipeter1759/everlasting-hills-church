import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { EvangelismViewer } from '../evangelism.types';
import { startOfLagosMonth, startOfLagosQuarter } from '../evangelism-dates.util';
import { windowState } from '../evangelism-window.util';
import { EvangelismAccessService } from './evangelism-access.service';

export interface PerformanceRow {
  id: string;
  name: string;
  photoUrl: string | null;
  onTeam: boolean;
  preached: number;
  saved: number;
  followUpsDone: number;
  followUpsPending: number;
  tasksDone: number;
  tasksPending: number;
  outreaches: number;
}

const FOLLOW_UP_KINDS = ['CALL', 'VISIT', 'MESSAGE', 'NOTE', 'STATUS'];

/**
 * How each worker is doing: people preached to and saved, follow-ups logged
 * against follow-ups still waiting, tasks, outreaches — for this month, this
 * quarter or all time. "Pending" follow-ups and tasks are counted as they
 * stand today, whatever the range.
 */
@Injectable()
export class EvangelismPerformanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: EvangelismAccessService,
  ) {}

  async table(viewer: EvangelismViewer, range: 'month' | 'quarter' | 'all' = 'month'): Promise<PerformanceRow[]> {
    const tenantId = this.access.tenant;
    const now = new Date();
    const since = range === 'month' ? startOfLagosMonth(now) : range === 'quarter' ? startOfLagosQuarter(now) : null;
    const inRange = since ? { gte: since } : undefined;

    const [team, contacts, openContacts, actions, tasks, outreachSeats] = await Promise.all([
      this.access.team(viewer.unitId),
      this.prisma.evangelismContact.findMany({
        where: { tenantId, workerMemberId: { not: null }, ...(inRange ? { contactDate: inRange } : {}) },
        select: { workerMemberId: true, savedStatus: true },
      }),
      this.prisma.evangelismContact.findMany({
        where: { tenantId, workerMemberId: { not: null }, closedAt: null },
        select: {
          workerMemberId: true,
          contactDate: true,
          windowEndsAt: true,
          status: true,
          callBackAt: true,
          lastActionAt: true,
          reviewOutcome: true,
          closedAt: true,
        },
      }),
      this.prisma.evangelismActivity.groupBy({
        by: ['actorMemberId'],
        where: { tenantId, actorMemberId: { not: null }, kind: { in: FOLLOW_UP_KINDS }, ...(inRange ? { happenedAt: inRange } : {}) },
        _count: { _all: true },
      }),
      this.prisma.evangelismTaskAssignee.findMany({
        where: { Task: { tenantId } },
        select: { memberId: true, Task: { select: { status: true, completedAt: true } } },
      }),
      this.prisma.evangelismOutreachWorker.findMany({
        where: { Outreach: { tenantId, ...(inRange ? { date: inRange } : {}) } },
        select: { memberId: true },
      }),
    ]);

    const rows = new Map<string, PerformanceRow>();
    const row = (id: string): PerformanceRow => {
      let r = rows.get(id);
      if (!r) {
        r = { id, name: '', photoUrl: null, onTeam: false, preached: 0, saved: 0, followUpsDone: 0, followUpsPending: 0, tasksDone: 0, tasksPending: 0, outreaches: 0 };
        rows.set(id, r);
      }
      return r;
    };

    for (const m of team) Object.assign(row(m.id), { name: m.name, photoUrl: m.photoUrl, onTeam: true });
    for (const c of contacts) {
      const r = row(c.workerMemberId!);
      r.preached++;
      if (c.savedStatus === 'YES') r.saved++;
    }
    for (const c of openContacts) {
      const state = windowState(c, now);
      if (state.open && (state.flag === 'DUE' || state.flag === 'OVERDUE' || c.status === 'NEW')) row(c.workerMemberId!).followUpsPending++;
    }
    for (const a of actions) row(a.actorMemberId!).followUpsDone += a._count._all;
    for (const t of tasks) {
      if (t.Task.status === 'DONE') {
        if (!since || (t.Task.completedAt && t.Task.completedAt >= since)) row(t.memberId).tasksDone++;
      } else row(t.memberId).tasksPending++;
    }
    for (const s of outreachSeats) row(s.memberId).outreaches++;

    // Former members who still have figures keep their row, under their name.
    const missing = [...rows.values()].filter((r) => !r.name).map((r) => r.id);
    const names = await this.access.names(missing);
    for (const id of missing) {
      const r = rows.get(id)!;
      r.name = names.get(id)?.name ?? 'Former member';
      r.photoUrl = names.get(id)?.photoUrl ?? null;
    }

    return [...rows.values()]
      .filter((r) => r.onTeam || r.preached + r.followUpsDone + r.tasksDone + r.tasksPending + r.outreaches > 0)
      .sort((a, b) => b.saved - a.saved || b.preached - a.preached || b.followUpsDone - a.followUpsDone || a.name.localeCompare(b.name));
  }
}
