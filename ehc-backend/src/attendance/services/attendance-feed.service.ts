import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { getTodayBounds, WAT_OFFSET_MS } from '../attendance.types';

@Injectable()
export class AttendanceFeedService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Today's live check-in feed — GET /attendance/feed/today */
  async getTodayFeed() {
    const { startUtc, endUtc } = getTodayBounds();
    const service = await this.prisma.service.findFirst({
      where: {
        tenantId: this.tenantId,
        scheduledAt: { gte: startUtc, lt: endUtc },
      },
    });
    const dateStr = new Date(Date.now() + WAT_OFFSET_MS).toISOString().slice(0, 10);
    if (!service) {
      return { date: dateStr, sessionId: null, serviceName: null, checkins: [] };
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: { serviceId: service.id, tenantId: this.tenantId, present: true },
      include: {
        Member: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true, phone: true },
        },
      },
      orderBy: { checkedInAt: 'asc' },
    });

    return {
      date: dateStr,
      sessionId: service.id,
      serviceName: service.name,
      checkins: records.map((r) => ({
        userId: r.Member.id,
        userName: `${r.Member.firstName} ${r.Member.lastName}`,
        photoUrl: r.Member.photoUrl ?? null,
        phone: r.Member.phone ?? null,
        markedAt: r.checkedInAt.toISOString(),
        markedBy: (r.markedBy ?? 'SELF') as 'SELF' | 'ADMIN',
      })),
    };
  }
}
