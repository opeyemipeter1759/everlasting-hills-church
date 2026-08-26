import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { ServiceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { WAT_OFFSET_MS } from '../headcount.util';
import { HeadcountClockService } from './headcount-clock.service';

/** Calendar-date-driven service lookup/creation for the "pick a date" headcount flow. */
@Injectable()
export class HeadcountDateService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: HeadcountClockService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** UTC bounds for a "YYYY-MM-DD" WAT calendar day. */
  dayBoundsUtc(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const startUtc = new Date(Date.UTC(y, m - 1, d) - WAT_OFFSET_MS);
    return { startUtc, endUtc: new Date(startUtc.getTime() + 86_400_000), y, m, d };
  }

  weekdayOf(dateStr: string): number {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sun, 3 = Wed
  }

  typeForWeekday(weekday: number): ServiceType {
    return weekday === 0 ? ServiceType.SUNDAY : weekday === 3 ? ServiceType.WEDNESDAY : ServiceType.SPECIAL;
  }

  /**
   * Today in WAT as YYYY-MM-DD, from the same clock canRecordDate uses.
   *
   * Returned to the client so a refused date can say WHY: if the server thinks
   * it is still yesterday (a stale ATTENDANCE_TEST_NOW, or a container whose
   * clock has drifted), an usher standing there on Wednesday morning sees that
   * instead of a flat "this date has not occurred yet".
   */
  todayStr(): string {
    const watNow = new Date(this.clock.getNow().getTime() + WAT_OFFSET_MS);
    return watNow.toISOString().slice(0, 10);
  }

  /** A headcount can be recorded for a date that is today or earlier (WAT). */
  canRecordDate(dateStr: string): boolean {
    const { startUtc } = this.dayBoundsUtc(dateStr);
    const watNow = new Date(this.clock.getNow().getTime() + WAT_OFFSET_MS);
    const todayStartUtc = new Date(
      Date.UTC(watNow.getUTCFullYear(), watNow.getUTCMonth(), watNow.getUTCDate()) - WAT_OFFSET_MS,
    );
    return startUtc.getTime() <= todayStartUtc.getTime();
  }

  async findServiceForDate(dateStr: string) {
    const { startUtc, endUtc } = this.dayBoundsUtc(dateStr);
    return this.prisma.service.findFirst({
      where: { tenantId: this.tenantId, scheduledAt: { gte: startUtc, lt: endUtc } },
      orderBy: { scheduledAt: 'asc' },
      select: { id: true, name: true, serviceType: true, scheduledAt: true, openAt: true, closeAt: true, isOpen: true },
    });
  }

  /** Create a service for a date, inferring its type from the weekday. */
  async createServiceForDate(dateStr: string) {
    const { y, m, d } = this.dayBoundsUtc(dateStr);
    const type = this.typeForWeekday(this.weekdayOf(dateStr));
    // Start time by type (WAT -> UTC): Sunday 09:00, Wednesday 17:30, else 10:00.
    const hourUtc = type === ServiceType.SUNDAY ? 8 : type === ServiceType.WEDNESDAY ? 16 : 9;
    const minUtc = type === ServiceType.WEDNESDAY ? 30 : 0;
    const scheduledAt = new Date(Date.UTC(y, m - 1, d, hourUtc, minUtc));
    const label = type === ServiceType.SUNDAY ? 'Sunday' : type === ServiceType.WEDNESDAY ? 'Wednesday' : 'Special';
    const pretty = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    });
    return this.prisma.service.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        name: `${label} Service, ${pretty}`,
        scheduledAt,
        serviceType: type,
      },
    });
  }
}
