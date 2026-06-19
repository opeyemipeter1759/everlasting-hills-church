import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';

const WAT_OFFSET_MS = 60 * 60 * 1000;

function getTodayBounds() {
  const now = new Date();
  const localNow = new Date(now.getTime() + WAT_OFFSET_MS);
  const midnightWAT = Date.UTC(
    localNow.getUTCFullYear(),
    localNow.getUTCMonth(),
    localNow.getUTCDate(),
  );
  const startUtc = new Date(midnightWAT - WAT_OFFSET_MS);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startUtc, endUtc };
}

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Returns the current time, substituting ATTENDANCE_TEST_NOW when set. */
  private getNow(): Date {
    const override = this.config.get('ATTENDANCE_TEST_NOW', { infer: true });
    return override?.trim() ? new Date(override.trim()) : new Date();
  }

  private parseHHMM(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Returns the active Service for today's window (Sunday 8:30–13:00 or
   * Wednesday 17:30–21:00 WAT), or null when outside those windows.
   *
   * Uses ATTENDANCE_TEST_NOW from env to override the clock for manual testing.
   */
  async getActiveSession() {
    if (this.config.get('ATTENDANCE_FORCE_OPEN', { infer: true })) {
      return this.findOrCreateTodayService();
    }

    const now = this.getNow();
    const watNow = new Date(now.getTime() + WAT_OFFSET_MS);
    const dayOfWeek = watNow.getUTCDay(); // 0 = Sun, 3 = Wed
    const minutesNow = watNow.getUTCHours() * 60 + watNow.getUTCMinutes();

    let openMin: number;
    let closeMin: number;

    if (dayOfWeek === 0) {
      openMin = this.parseHHMM(this.config.get('ATTENDANCE_SUNDAY_OPEN', { infer: true }));
      closeMin = this.parseHHMM(this.config.get('ATTENDANCE_SUNDAY_CLOSE', { infer: true }));
    } else if (dayOfWeek === 3) {
      openMin = this.parseHHMM(this.config.get('ATTENDANCE_WEDNESDAY_OPEN', { infer: true }));
      closeMin = this.parseHHMM(this.config.get('ATTENDANCE_WEDNESDAY_CLOSE', { infer: true }));
    } else {
      return null;
    }

    if (minutesNow < openMin || minutesNow >= closeMin) return null;

    return this.findOrCreateTodayService();
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

    const member = await this.getMemberByUserId(userId);
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

  /**
   * Resolve the signed-in user's Member row from their Supabase userId.
   *
   * Self-healing: if a Profile exists but no Member row is attached, we
   * auto-provision a minimal Member using the JWT email so check-in just
   * works for orphan accounts (e.g. a SUPER_ADMIN seeded before the Member
   * code path existed, or a user whose Member row was deleted).
   *
   * Returns null only when the Profile itself is missing — that genuinely
   * needs an admin to assign a role.
   */
  private async getMemberByUserId(userId: string, fallbackEmail?: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true, tenantId: true },
    });
    if (!profile) {
      return null;
    }

    const existing = await this.prisma.member.findUnique({
      where: { profileId: profile.id },
    });
    if (existing) return existing;

    // Auto-provision
    const created = await this.prisma.member.create({
      data: {
        id: randomUUID(),
        tenantId: profile.tenantId,
        profileId: profile.id,
        firstName: 'New',
        lastName: 'Member',
        email: fallbackEmail ?? null,
      },
    });
    this.logger.log(
      `Auto-provisioned Member ${created.id} for orphan profile ${profile.id} (${fallbackEmail ?? 'no email'})`,
    );
    return created;
  }

  private async getTodayService() {
    const { startUtc, endUtc } = getTodayBounds();
    return this.prisma.service.findFirst({
      where: {
        tenantId: this.tenantId,
        scheduledAt: {
          gte: startUtc,
          lt: endUtc,
        },
      },
    });
  }

  private async findOrCreateTodayService() {
    const existing = await this.getTodayService();
    if (existing) {
      return existing;
    }

    const { startUtc } = getTodayBounds();
    const label = new Date(startUtc.getTime() + WAT_OFFSET_MS).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return this.prisma.service.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        name: `Sunday Service — ${label}`,
        scheduledAt: startUtc,
      },
    });
  }

  async checkIn(userId: string, fallbackEmail?: string) {
    const member = await this.getMemberByUserId(userId, fallbackEmail);
    if (!member) {
      throw new NotFoundException(
        'Your account has no profile yet. Contact an admin.',
      );
    }

    const service = await this.findOrCreateTodayService();

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: {
        memberId_serviceId: {
          memberId: member.id,
          serviceId: service.id,
        },
      },
    });

    if (existing) {
      return { alreadyCheckedIn: true as const, service };
    }

    await this.prisma.attendanceRecord.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        memberId: member.id,
        serviceId: service.id,
        present: true,
      },
    });

    return { alreadyCheckedIn: false as const, service };
  }

  async checkInByServiceId(userId: string, serviceId: string, fallbackEmail?: string) {
    const member = await this.getMemberByUserId(userId, fallbackEmail);
    if (!member) {
      throw new NotFoundException(
        'Your account has no profile yet. Contact an admin.',
      );
    }

    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId: this.tenantId },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: {
        memberId_serviceId: {
          memberId: member.id,
          serviceId: service.id,
        },
      },
    });

    if (existing) {
      return { alreadyCheckedIn: true as const, service };
    }

    await this.prisma.attendanceRecord.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        memberId: member.id,
        serviceId: service.id,
        present: true,
      },
    });

    return { alreadyCheckedIn: false as const, service };
  }

  async getMemberAttendance(userId: string) {
    const member = await this.getMemberByUserId(userId);
    if (!member) {
      return [];
    }

    return this.prisma.attendanceRecord.findMany({
      where: {
        memberId: member.id,
        tenantId: this.tenantId,
      },
      include: {
        Service: true,
      },
      orderBy: {
        Service: {
          scheduledAt: 'desc',
        },
      },
    });
  }

  async getTodayAttendanceWithMembers() {
    const service = await this.getTodayService();
    if (!service) {
      return null;
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        serviceId: service.id,
        tenantId: this.tenantId,
        present: true,
      },
      include: {
        Member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return { service, records };
  }

  async getAllServicesWithCounts() {
    return this.prisma.service.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { scheduledAt: 'desc' },
      include: {
        _count: {
          select: {
            AttendanceRecord: {
              where: { present: true },
            },
          },
        },
      },
      take: 50,
    });
  }

  async getNextService() {
    return this.prisma.service.findFirst({
      where: {
        tenantId: this.tenantId,
        scheduledAt: { gt: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async countTotalServices() {
    return this.prisma.service.count({ where: { tenantId: this.tenantId } });
  }

  async getRecentServicesStats(limit = 4) {
    return this.prisma.service.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { scheduledAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: {
            AttendanceRecord: {
              where: { present: true },
            },
          },
        },
      },
    });
  }

  async countTodayCheckIns() {
    const service = await this.getTodayService();
    if (!service) {
      return 0;
    }

    return this.prisma.attendanceRecord.count({
      where: {
        serviceId: service.id,
        tenantId: this.tenantId,
        present: true,
      },
    });
  }

  async getAttendanceTrend(limit = 16) {
    const services = await this.prisma.service.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { scheduledAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: {
            AttendanceRecord: {
              where: { present: true },
            },
          },
        },
      },
    });

    return [...services].reverse().map((service) => ({
      id: service.id,
      name: service.name,
      date: service.scheduledAt.toISOString(),
      label: service.scheduledAt.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      }),
      count: service._count.AttendanceRecord,
    }));
  }

  async getAttendanceByDayOfWeek() {
    const services = await this.prisma.service.findMany({
      where: { tenantId: this.tenantId },
      include: {
        _count: {
          select: {
            AttendanceRecord: {
              where: { present: true },
            },
          },
        },
      },
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const totals = new Array(7).fill(0);
    const counts = new Array(7).fill(0);

    services.forEach((service) => {
      const dayOfWeek = new Date(service.scheduledAt).getDay();
      totals[dayOfWeek] += service._count.AttendanceRecord;
      counts[dayOfWeek] += 1;
    });

    return days.map((label, index) => ({
      label,
      avg: counts[index] > 0 ? Math.round(totals[index] / counts[index]) : 0,
      total: totals[index],
    }));
  }

  async getTopAttendees(limit = 10) {
    const records = await this.prisma.attendanceRecord.groupBy({
      by: ['memberId'],
      where: { tenantId: this.tenantId, present: true },
      _count: { _all: true },
      orderBy: { _count: { memberId: 'desc' } },
      take: limit,
    });

    const memberIds = records.map((record) => record.memberId);
    const members = await this.prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, firstName: true, lastName: true, photoUrl: true },
    });

    const memberMap = Object.fromEntries(members.map((member) => [member.id, member]));

    return records.map((record) => {
      const member = memberMap[record.memberId];
      return {
        memberId: record.memberId,
        name: member ? `${member.firstName} ${member.lastName}` : 'Unknown',
        photoUrl: member?.photoUrl ?? null,
        count: record._count._all,
      };
    });
  }

  async getAttendanceSummary() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totalServices, totalCheckins, thisMonthCheckins, lastMonthCheckins, totalMembers] =
      await Promise.all([
        this.prisma.service.count({ where: { tenantId: this.tenantId } }),
        this.prisma.attendanceRecord.count({ where: { tenantId: this.tenantId, present: true } }),
        this.prisma.attendanceRecord.count({
          where: {
            tenantId: this.tenantId,
            present: true,
            Service: { scheduledAt: { gte: monthStart } },
          },
        }),
        this.prisma.attendanceRecord.count({
          where: {
            tenantId: this.tenantId,
            present: true,
            Service: { scheduledAt: { gte: lastMonthStart, lt: monthStart } },
          },
        }),
        this.prisma.member.count({ where: { tenantId: this.tenantId, status: 'ACTIVE' } }),
      ]);

    const avgAttendance = totalServices > 0 ? Math.round(totalCheckins / totalServices) : 0;
    const momChange =
      lastMonthCheckins === 0
        ? 0
        : Math.round(((thisMonthCheckins - lastMonthCheckins) / lastMonthCheckins) * 100);

    return {
      totalServices,
      totalCheckins,
      thisMonthCheckins,
      lastMonthCheckins,
      avgAttendance,
      momChange,
      totalMembers,
      attendanceRate: totalMembers > 0 ? Math.round((avgAttendance / totalMembers) * 100) : 0,
    };
  }
}