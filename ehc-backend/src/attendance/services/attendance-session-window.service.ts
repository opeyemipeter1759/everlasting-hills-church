import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { ServiceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { getDayBounds, getTodayBounds, WAT_OFFSET_MS } from '../attendance.types';
import { AttendanceMemberLookupService } from './attendance-member-lookup.service';
import { resolveNow } from '../../common/test-clock.util';

/** Resolves and manages "today's active service window" (open/close times, auto-creation). */
@Injectable()
export class AttendanceSessionWindowService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly memberLookup: AttendanceMemberLookupService,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Returns the current time, substituting ATTENDANCE_TEST_NOW when set. */
  private getNow(): Date {
    return resolveNow(this.config.get('ATTENDANCE_TEST_NOW', { infer: true }));
  }

  private parseHHMM(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  async getTodayService() {
    const { startUtc, endUtc } = getTodayBounds();
    return this.prisma.service.findFirst({
      where: {
        tenantId: this.tenantId,
        scheduledAt: { gte: startUtc, lt: endUtc },
      },
    });
  }

  /**
   * Look up the Service scheduled on the same WAT calendar day as `at`, without
   * creating one. Used to tag a Visitor/first-timer submission with the service
   * day it belongs to — returns null when nothing was scheduled that day (e.g.
   * a form filled outside a normal service window).
   */
  async getServiceForDate(at: Date) {
    const { startUtc, endUtc } = getDayBounds(at);
    return this.prisma.service.findFirst({
      where: {
        tenantId: this.tenantId,
        scheduledAt: { gte: startUtc, lt: endUtc },
      },
    });
  }

  /**
   * Returns the active Service for today's window (Sunday 8:30–13:00 or
   * Wednesday 17:30–21:00 WAT), or null when outside those windows.
   *
   * Uses ATTENDANCE_TEST_NOW from env to override the clock for manual testing.
   */
  async getActiveSession() {
    if (this.config.get('ATTENDANCE_FORCE_OPEN', { infer: true }) === true) {
      return this.findOrCreateTodayService();
    }

    const now = this.getNow();
    const watNow = new Date(now.getTime() + WAT_OFFSET_MS);
    const dayOfWeek = watNow.getUTCDay(); // 0 = Sun, 3 = Wed
    const minutesNow = watNow.getUTCHours() * 60 + watNow.getUTCMinutes();

    const window =
      dayOfWeek === 0
        ? { open: this.config.get('ATTENDANCE_SUNDAY_OPEN', { infer: true }), close: this.config.get('ATTENDANCE_SUNDAY_CLOSE', { infer: true }) }
        : dayOfWeek === 3
          ? { open: this.config.get('ATTENDANCE_WEDNESDAY_OPEN', { infer: true }), close: this.config.get('ATTENDANCE_WEDNESDAY_CLOSE', { infer: true }) }
          : null;
    if (!window) return null;

    const openMin = this.parseHHMM(window.open);
    const closeMin = this.parseHHMM(window.close);
    if (minutesNow < openMin || minutesNow >= closeMin) return null;

    return this.findOrCreateTodayService();
  }

  async findOrCreateTodayService() {
    const existing = await this.getTodayService();
    if (existing) {
      return existing;
    }

    const { startUtc } = getTodayBounds();
    const watDate = new Date(startUtc.getTime() + WAT_OFFSET_MS);
    const dow = watDate.getUTCDay();
    const label = watDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Name + type follow the actual weekday so a service auto-created on a
    // non-Sunday (e.g. while ATTENDANCE_FORCE_OPEN testing) isn't mislabeled.
    let serviceType: ServiceType = ServiceType.SPECIAL;
    let title: string;
    if (dow === 0) {
      serviceType = ServiceType.SUNDAY;
      title = 'Sunday Service';
    } else if (dow === 3) {
      serviceType = ServiceType.WEDNESDAY;
      title = 'Midweek Service';
    } else {
      title = `${watDate.toLocaleDateString('en-GB', { weekday: 'long' })} Service`;
    }

    return this.prisma.service.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        name: `${title} — ${label}`,
        scheduledAt: startUtc,
        serviceType,
      },
    });
  }

  /**
   * Check whether the current user is allowed to mark attendance right now.
   *
   * Order of checks:
   *  1. Is there an active session window? → NO_OPEN_SESSION
   *  2. Has the user already checked in?  → ALREADY_MARKED
   *  3. Otherwise                          → canMark: true
   */
  async canMark(userId: string) {
    const session = await this.getActiveSession();
    if (!session) {
      return { canMark: false as const, reason: 'NO_OPEN_SESSION' as const };
    }

    const member = await this.memberLookup.getMemberByUserId(userId);
    if (!member) {
      // No member profile yet — session is open; auto-provision happens on checkIn.
      return { canMark: true as const };
    }

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: {
        memberId_serviceId: { memberId: member.id, serviceId: session.id },
      },
    });

    if (existing) {
      return { canMark: false as const, reason: 'ALREADY_MARKED' as const };
    }

    return { canMark: true as const };
  }
}
