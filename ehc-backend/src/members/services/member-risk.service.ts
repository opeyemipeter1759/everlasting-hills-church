import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { ACTIVE_MEMBER, activeMembersOf } from '../active-members';
import { watDateStr } from '../../attendance/attendance-list.util';
import { RATE_WINDOW, judgeMember, type RiskSunday } from './member-risk.util';

/** How far back to look for a streak of missed Sundays (about half a year). */
const STREAK_LOOKBACK = 26;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * GET /members/at-risk — active members who need checking on, judged on the
 * Sundays held since each one joined (see judgeMember). Sundays only: the
 * midweek service is checked into by too few people to measure anyone by.
 * Every number is real: the Sundays missed in a row, the Sundays attended out
 * of the last eight, and the last service each person checked into.
 */
@Injectable()
export class MemberRiskService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Sundays that are over: the day has passed, or the service closed and its absences were written. */
  private async heldSundays(now: Date): Promise<RiskSunday[]> {
    const recent = await this.prisma.service.findMany({
      where: { tenantId: this.tenantId, serviceType: ServiceType.SUNDAY, cancelledAt: null, scheduledAt: { lte: now } },
      orderBy: { scheduledAt: 'desc' },
      take: STREAK_LOOKBACK + 1,
      select: { id: true, scheduledAt: true },
    });
    const today = recent.find((s) => s.scheduledAt.getTime() + DAY_MS > now.getTime());
    if (!today) return recent.slice(0, STREAK_LOOKBACK);
    const closed = await this.prisma.attendanceRecord.count({ where: { serviceId: today.id, present: false } });
    return (closed > 0 ? recent : recent.filter((s) => s.id !== today.id)).slice(0, STREAK_LOOKBACK);
  }

  async getMembersAtRisk(now = new Date()) {
    const sundays = await this.heldSundays(now);
    const [members, sundayPresent, lastSeenRows] = await Promise.all([
      this.prisma.member.findMany({
        where: activeMembersOf(this.tenantId),
        select: { id: true, firstName: true, lastName: true, photoUrl: true, phone: true, joinedAt: true },
      }),
      this.prisma.attendanceRecord.findMany({
        where: { tenantId: this.tenantId, present: true, serviceId: { in: sundays.map((s) => s.id) } },
        select: { memberId: true, serviceId: true },
      }),
      // The last service of any kind each active member checked into.
      this.prisma.attendanceRecord.findMany({
        where: { tenantId: this.tenantId, present: true, Member: ACTIVE_MEMBER },
        orderBy: { Service: { scheduledAt: 'desc' } },
        distinct: ['memberId'],
        select: { memberId: true, Service: { select: { scheduledAt: true } } },
      }),
    ]);

    const presentBy = new Map<string, Set<string>>();
    for (const r of sundayPresent) {
      if (!presentBy.has(r.memberId)) presentBy.set(r.memberId, new Set());
      presentBy.get(r.memberId)!.add(r.serviceId);
    }
    const lastSeen = new Map(lastSeenRows.map((r) => [r.memberId, watDateStr(r.Service.scheduledAt)]));

    type Person = { userId: string; userName: string; photoUrl: string | null; phone: string | null; lastSeen: string | null };
    const absentConsecutiveWeeks: (Person & { consecutiveAbsences: number; presentCount: number; totalCount: number })[] = [];
    const neverAttended: (Person & { joinedAt: string; sundaysSinceJoining: number })[] = [];
    const belowFiftyPercent: (Person & { presentCount: number; totalCount: number; rate: number })[] = [];
    for (const m of members) {
      const verdict = judgeMember(m, sundays, presentBy.get(m.id) ?? new Set(), lastSeen.has(m.id));
      if (!verdict) continue;
      const person: Person = {
        userId: m.id,
        userName: `${m.firstName} ${m.lastName}`,
        photoUrl: m.photoUrl ?? null,
        phone: m.phone ?? null,
        lastSeen: lastSeen.get(m.id) ?? null,
      };
      if (verdict.kind === 'never') {
        neverAttended.push({ ...person, joinedAt: watDateStr(m.joinedAt), sundaysSinceJoining: verdict.eligible });
      } else if (verdict.kind === 'in-a-row') {
        absentConsecutiveWeeks.push({ ...person, consecutiveAbsences: verdict.missed, presentCount: verdict.attended, totalCount: verdict.eligible });
      } else {
        belowFiftyPercent.push({
          ...person,
          presentCount: verdict.attended,
          totalCount: verdict.eligible,
          rate: Math.round((verdict.attended / verdict.eligible) * 100) / 100,
        });
      }
    }

    absentConsecutiveWeeks.sort((a, b) => b.consecutiveAbsences - a.consecutiveAbsences || a.userName.localeCompare(b.userName));
    neverAttended.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt) || a.userName.localeCompare(b.userName));
    belowFiftyPercent.sort((a, b) => a.rate - b.rate || a.userName.localeCompare(b.userName));

    const window = sundays.slice(0, RATE_WINDOW);
    return {
      absentConsecutiveWeeks,
      neverAttended,
      belowFiftyPercent,
      /** The Sundays the rate is measured over, oldest and newest. */
      window: {
        sundays: window.length,
        from: window.length ? watDateStr(window[window.length - 1].scheduledAt) : null,
        to: window.length ? watDateStr(window[0].scheduledAt) : null,
      },
    };
  }
}
