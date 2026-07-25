import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

/** GET /members/at-risk — three risk categories: never attended, consecutive absences, low rate. */
@Injectable()
export class MemberRiskService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getMembersAtRisk() {
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [members, totalServices, presentThisMonth, recentPresent] =
      await Promise.all([
        this.prisma.member.findMany({
          where: { tenantId: this.tenantId, status: 'ACTIVE' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            phone: true,
            joinedAt: true,
          },
        }),
        this.prisma.service.count({ where: { tenantId: this.tenantId } }),
        this.prisma.attendanceRecord.groupBy({
          by: ['memberId'],
          where: {
            tenantId: this.tenantId,
            present: true,
            Service: { scheduledAt: { gte: monthStart } },
          },
        }),
        this.prisma.attendanceRecord.groupBy({
          by: ['memberId'],
          where: {
            tenantId: this.tenantId,
            present: true,
            Service: { scheduledAt: { gte: fourWeeksAgo } },
          },
        }),
      ]);

    const presentThisMonthSet = new Set(
      presentThisMonth.map((r) => r.memberId),
    );
    const recentPresentSet = new Set(recentPresent.map((r) => r.memberId));

    const allTimePresent = await this.prisma.attendanceRecord.groupBy({
      by: ['memberId'],
      where: { tenantId: this.tenantId, present: true },
      _count: { _all: true },
    });
    const presentCountMap = new Map(
      allTimePresent.map((r) => [r.memberId, r._count._all]),
    );

    const neverAttended = members
      .filter(
        (m) =>
          !presentCountMap.has(m.id) && new Date(m.joinedAt) < fourWeeksAgo,
      )
      .map((m) => ({
        userId: m.id,
        userName: `${m.firstName} ${m.lastName}`,
        photoUrl: m.photoUrl ?? null,
        phone: m.phone ?? null,
        joinedAt: m.joinedAt.toISOString().slice(0, 10),
      }));

    const absentConsecutiveWeeks = members
      .filter((m) => presentCountMap.has(m.id) && !recentPresentSet.has(m.id))
      .map((m) => ({
        userId: m.id,
        userName: `${m.firstName} ${m.lastName}`,
        photoUrl: m.photoUrl ?? null,
        phone: m.phone ?? null,
        consecutiveAbsences: Math.ceil(
          (Date.now() - new Date(m.joinedAt).getTime()) /
            (7 * 24 * 60 * 60 * 1000),
        ),
        lastSeen: null,
      }));

    const belowFiftyPercent = members
      .filter((m) => {
        const count = presentCountMap.get(m.id) ?? 0;
        return totalServices > 0 && count / totalServices < 0.5 && count > 0;
      })
      .map((m) => {
        const presentCount = presentCountMap.get(m.id) ?? 0;
        return {
          userId: m.id,
          userName: `${m.firstName} ${m.lastName}`,
          photoUrl: m.photoUrl ?? null,
          phone: m.phone ?? null,
          presentCount,
          totalCount: totalServices,
          rate: Math.round((presentCount / totalServices) * 100) / 100,
        };
      });

    return { absentConsecutiveWeeks, neverAttended, belowFiftyPercent };
  }
}
