import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as XLSX from 'xlsx';
import { ServiceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';

export type AttendanceStatus = 'PRESENT' | 'ABSENT';
export type MarkedBy = 'SELF' | 'ADMIN';
export type SortOrder = 'ASC' | 'DESC';

export interface ListAttendanceQuery {
  page?: number;
  limit?: number;
  name?: string;
  status?: AttendanceStatus;
  serviceKey?: string;
  year?: string;
  month?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  markedBy?: MarkedBy;
  sortBy?: string;
  sortOrder?: SortOrder;
}

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

export interface MemberHistoryRow {
  id: string;
  serviceName: string;
  date: string;
  status: 'present' | 'absent';
  mode: 'onsite' | null;
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
    if (this.config.get('ATTENDANCE_FORCE_OPEN', { infer: true }) === true) {
      return this.findOrCreateTodayService();
    }

    const now = this.getNow();
    const watNow = new Date(now.getTime() + WAT_OFFSET_MS);
    const dayOfWeek = watNow.getUTCDay(); // 0 = Sun, 3 = Wed
    const minutesNow = watNow.getUTCHours() * 60 + watNow.getUTCMinutes();

    let openMin: number;
    let closeMin: number;

    if (dayOfWeek === 0) {
      openMin = this.parseHHMM(
        this.config.get('ATTENDANCE_SUNDAY_OPEN', { infer: true }),
      );
      closeMin = this.parseHHMM(
        this.config.get('ATTENDANCE_SUNDAY_CLOSE', { infer: true }),
      );
    } else if (dayOfWeek === 3) {
      openMin = this.parseHHMM(
        this.config.get('ATTENDANCE_WEDNESDAY_OPEN', { infer: true }),
      );
      closeMin = this.parseHHMM(
        this.config.get('ATTENDANCE_WEDNESDAY_CLOSE', { infer: true }),
      );
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

  async checkInByServiceId(
    userId: string,
    serviceId: string,
    fallbackEmail?: string,
  ) {
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

  /**
   * Per-service attendance tracking for the signed-in member: one row for every
   * past service, marked present/absent by cross-referencing their check-ins.
   * Powers the member "My Attendance" table (present rows are mode "onsite";
   * absent rows have no mode).
   */
  async getMemberHistory(userId: string) {
    const member = await this.getMemberByUserId(userId);
    if (!member) {
      return { member: null, records: [] as MemberHistoryRow[] };
    }

    // The member's own check-in records first, so we always surface a service
    // they actually attended — even if its scheduled timestamp predates their
    // join time (e.g. a service stamped at midnight that they joined + checked
    // into later the same day).
    const records = await this.prisma.attendanceRecord.findMany({
      where: { memberId: member.id, tenantId: this.tenantId },
      select: { serviceId: true, present: true, checkedInAt: true },
    });
    const recordServiceIds = records.map((r) => r.serviceId);

    // A service appears in the member's history if EITHER:
    //   • they have a check-in for it (always show what they attended), OR
    //   • it occurred on/after they joined (so we can mark genuine absences,
    //     without penalising them for services before they were a member).
    const services = await this.prisma.service.findMany({
      where: {
        tenantId: this.tenantId,
        scheduledAt: { lte: new Date() },
        OR: [
          { scheduledAt: { gte: member.joinedAt } },
          { id: { in: recordServiceIds } },
        ],
      },
      orderBy: { scheduledAt: 'desc' },
      take: 365,
      select: { id: true, name: true, scheduledAt: true },
    });

    const byService = new Map(records.map((r) => [r.serviceId, r]));
    const rows: MemberHistoryRow[] = services.map((s) => {
      const rec = byService.get(s.id);
      const present = rec?.present ?? false;
      return {
        id: s.id,
        serviceName: s.name,
        date: s.scheduledAt.toISOString(),
        status: present ? 'present' : 'absent',
        mode: present ? 'onsite' : null,
      };
    });

    return {
      member: {
        name: `${member.firstName} ${member.lastName}`.trim(),
        email: member.email,
        phone: member.phone,
      },
      records: rows,
    };
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

  // ── Service session management (ADMIN) ──────────────────────────────────────

  async createService(input: { name: string; scheduledAt: string; serviceType?: ServiceType }) {
    return this.prisma.service.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        name: input.name.trim(),
        scheduledAt: new Date(input.scheduledAt),
        ...(input.serviceType ? { serviceType: input.serviceType } : {}),
      },
    });
  }

  /** Open a session for check-in. Stamps openAt the first time it opens. */
  async openService(serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId: this.tenantId },
    });
    if (!service) throw new NotFoundException('Service not found');
    return this.prisma.service.update({
      where: { id: serviceId },
      data: { isOpen: true, openAt: service.openAt ?? new Date() },
    });
  }

  /** Close a session. Stamps closeAt. */
  async closeService(serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId: this.tenantId },
    });
    if (!service) throw new NotFoundException('Service not found');
    return this.prisma.service.update({
      where: { id: serviceId },
      data: { isOpen: false, closeAt: new Date() },
    });
  }

  /**
   * Build a CSV of who attended a given service. Returns the filename + content
   * so the frontend can trigger a download (keeps the JSON response envelope intact).
   */
  async exportServiceCsv(serviceId: string): Promise<{ filename: string; csv: string }> {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId: this.tenantId },
    });
    if (!service) throw new NotFoundException('Service not found');

    const records = await this.prisma.attendanceRecord.findMany({
      where: { serviceId, tenantId: this.tenantId, present: true },
      include: {
        Member: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
      orderBy: { checkedInAt: 'asc' },
    });

    const header = ['First Name', 'Last Name', 'Email', 'Phone', 'Checked In At'];
    const rows = records.map((r) => [
      r.Member.firstName,
      r.Member.lastName,
      r.Member.email ?? '',
      r.Member.phone ?? '',
      r.checkedInAt.toISOString(),
    ]);
    const csv = [header, ...rows]
      .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const safeName = service.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    return { filename: `attendance-${safeName}.csv`, csv };
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

    const memberMap = Object.fromEntries(
      members.map((member) => [member.id, member]),
    );

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

  // ── New admin endpoints ─────────────────────────────────────────────────────

  private svcKey(d: Date): string {
    const day = new Date(d.getTime() + WAT_OFFSET_MS).getUTCDay();
    return day === 0 ? 'sunday' : day === 3 ? 'wednesday' : 'other';
  }

  private watDateStr(d: Date): string {
    return new Date(d.getTime() + WAT_OFFSET_MS).toISOString().slice(0, 10);
  }

  /** Attendance list with filters, sort, pagination — GET /attendance */
  async listAttendance(q: ListAttendanceQuery) {
    const {
      name,
      status,
      serviceKey,
      year,
      month,
      date,
      dateFrom,
      dateTo,
      sortBy = 'date',
      sortOrder = 'DESC',
    } = q;
    const page = Math.max(1, Number(q.page ?? 1) || 1);
    const limit = Math.min(200, Math.max(1, Number(q.limit ?? 20) || 20));

    // Parse a "yyyy-MM-dd" string as WAT midnight (UTC+1).
    // new Date("yyyy-MM-dd") is always UTC midnight; subtracting the WAT offset
    // converts it to the correct UTC timestamp for WAT 00:00 local time.
    const watMidnight = (iso: string) =>
      new Date(new Date(iso).getTime() - WAT_OFFSET_MS);

    const scheduledFilter: Record<string, Date> = {};
    if (date) {
      const start = watMidnight(date);
      scheduledFilter.gte = start;
      scheduledFilter.lt = new Date(start.getTime() + 86_400_000);
    } else if (month) {
      const [y, m] = month.split('-').map(Number);
      scheduledFilter.gte = new Date(y, m - 1, 1);
      scheduledFilter.lt = new Date(y, m, 1);
    } else if (year) {
      scheduledFilter.gte = new Date(Number(year), 0, 1);
      scheduledFilter.lt = new Date(Number(year) + 1, 0, 1);
    } else {
      if (dateFrom) scheduledFilter.gte = watMidnight(dateFrom);
      if (dateTo) {
        scheduledFilter.lt = new Date(watMidnight(dateTo).getTime() + 86_400_000);
      }
    }

    const where: Record<string, unknown> = {
      tenantId: this.tenantId,
      ...(status !== undefined ? { present: status === 'PRESENT' } : {}),
      ...(name
        ? {
            Member: {
              OR: [
                { firstName: { contains: name, mode: 'insensitive' } },
                { lastName: { contains: name, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
      ...(Object.keys(scheduledFilter).length
        ? { Service: { scheduledAt: scheduledFilter } }
        : {}),
    };

    const orderBy: Record<string, unknown> =
      sortBy === 'name'
        ? { Member: { firstName: sortOrder === 'ASC' ? 'asc' : 'desc' } }
        : sortBy === 'status'
          ? { present: sortOrder === 'ASC' ? 'asc' : 'desc' }
          : sortBy === 'markedAt'
            ? { checkedInAt: sortOrder === 'ASC' ? 'asc' : 'desc' }
            : {
                Service: { scheduledAt: sortOrder === 'ASC' ? 'asc' : 'desc' },
              };

    const [records, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          Member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
              phone: true,
            },
          },
          Service: { select: { id: true, name: true, scheduledAt: true } },
        },
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    const filtered = serviceKey
      ? records.filter((r) => this.svcKey(r.Service.scheduledAt) === serviceKey)
      : records;

    const data = filtered.map((r) => ({
      id: r.id,
      sessionId: r.serviceId,
      serviceName: r.Service.name,
      serviceKey: this.svcKey(r.Service.scheduledAt),
      date: this.watDateStr(r.Service.scheduledAt),
      userId: r.Member.id,
      userName: `${r.Member.firstName} ${r.Member.lastName}`,
      photoUrl: r.Member.photoUrl ?? null,
      phone: r.Member.phone ?? null,
      status: r.present ? 'PRESENT' : 'ABSENT',
      markedBy: (r.markedBy ?? 'SELF') as 'SELF' | 'ADMIN',
      markedAt: r.checkedInAt.toISOString(),
    }));

    return {
      data,
      filters: {
        name: name ?? null,
        status: status ?? null,
        serviceKey: serviceKey ?? null,
        year: year ?? null,
        month: month ?? null,
        date: date ?? null,
        dateFrom: dateFrom ?? null,
        dateTo: dateTo ?? null,
        markedBy: q.markedBy ?? null,
        sortBy,
        sortOrder,
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        presentCount: data.filter((d) => d.status === 'PRESENT').length,
        absentCount: data.filter((d) => d.status === 'ABSENT').length,
      },
    };
  }

  /** Inline status override — PATCH /attendance/session/:sessionId/member/:userId */
  async overrideAttendance(
    sessionId: string,
    userId: string,
    status: AttendanceStatus,
  ) {
    const [service, member] = await Promise.all([
      this.prisma.service.findFirst({
        where: { id: sessionId, tenantId: this.tenantId },
      }),
      this.prisma.member.findFirst({
        where: { id: userId, tenantId: this.tenantId },
      }),
    ]);
    if (!service) throw new NotFoundException('Session not found');
    if (!member) throw new NotFoundException('Member not found');

    const present = status === 'PRESENT';
    const record = await this.prisma.attendanceRecord.upsert({
      where: {
        memberId_serviceId: { memberId: member.id, serviceId: service.id },
      },
      update: { present, markedBy: 'ADMIN', checkedInAt: new Date() },
      create: {
        id: randomUUID(),
        tenantId: this.tenantId,
        memberId: member.id,
        serviceId: service.id,
        present,
        markedBy: 'ADMIN',
      },
    });

    return {
      id: record.id,
      status: record.present ? 'PRESENT' : 'ABSENT',
      markedBy: record.markedBy,
      markedAt: record.checkedInAt.toISOString(),
    };
  }

  /** Bulk mark — PATCH /attendance/session/:sessionId/bulk */
  async bulkMarkAttendance(
    sessionId: string,
    userIds: string[],
    status: AttendanceStatus,
  ) {
    const service = await this.prisma.service.findFirst({
      where: { id: sessionId, tenantId: this.tenantId },
    });
    if (!service) throw new NotFoundException('Session not found');

    const members = await this.prisma.member.findMany({
      where: { id: { in: userIds }, tenantId: this.tenantId },
      select: { id: true },
    });
    const present = status === 'PRESENT';
    let updated = 0;

    for (const m of members) {
      await this.prisma.attendanceRecord.upsert({
        where: {
          memberId_serviceId: { memberId: m.id, serviceId: service.id },
        },
        update: { present, markedBy: 'ADMIN', checkedInAt: new Date() },
        create: {
          id: randomUUID(),
          tenantId: this.tenantId,
          memberId: m.id,
          serviceId: service.id,
          present,
          markedBy: 'ADMIN',
        },
      });
      updated++;
    }
    return { updated };
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
    const dateStr = new Date(Date.now() + WAT_OFFSET_MS)
      .toISOString()
      .slice(0, 10);
    if (!service)
      return {
        date: dateStr,
        sessionId: null,
        serviceName: null,
        checkins: [],
      };

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

  /**
   * Mark every member who has NO record (or an absent record) for a service as ABSENT.
   * Called automatically when a session window closes, and exposed as a manual endpoint.
   * Returns the count of records upserted.
   */
  async markMissingAsAbsent(serviceId: string): Promise<{ marked: number }> {
    const [service, members] = await Promise.all([
      this.prisma.service.findUnique({ where: { id: serviceId } }),
      this.prisma.member.findMany({
        where: { tenantId: this.tenantId },
        select: { id: true },
      }),
    ]);
    if (!service) return { marked: 0 };

    const existing = await this.prisma.attendanceRecord.findMany({
      where: { serviceId, tenantId: this.tenantId, present: true },
      select: { memberId: true },
    });
    const presentIds = new Set(existing.map((r) => r.memberId));
    const absentMembers = members.filter((m) => !presentIds.has(m.id));

    if (absentMembers.length === 0) return { marked: 0 };

    await Promise.all(
      absentMembers.map((m) =>
        this.prisma.attendanceRecord.upsert({
          where: { memberId_serviceId: { memberId: m.id, serviceId } },
          create: {
            id: randomUUID(),
            tenantId: this.tenantId,
            memberId: m.id,
            serviceId,
            present: false,
            markedBy: 'ADMIN',
            checkedInAt: new Date(),
          },
          update: { present: false, markedBy: 'ADMIN' },
        }),
      ),
    );

    return { marked: absentMembers.length };
  }

  /** Excel export — GET /attendance/export */
  async exportAttendanceCsv(q: Omit<ListAttendanceQuery, 'page' | 'limit'>) {
    const result = await this.listAttendance({ ...q, page: 1, limit: 10_000 });
    const headers = [
      'Member',
      'Phone',
      'Service',
      'Date',
      'Status',
      'Marked By',
      'Marked At',
    ];
    const rows = result.data.map((r) => [
      r.userName,
      r.phone ?? '',
      r.serviceName,
      r.date,
      r.status,
      r.markedBy,
      r.markedAt ?? '',
    ]);
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = headers.map((h, ci) => ({
      wch:
        Math.max(h.length, ...rows.map((r) => String(r[ci] ?? '').length)) + 2,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async getAttendanceSummary() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalServices,
      totalCheckins,
      thisMonthCheckins,
      lastMonthCheckins,
      totalMembers,
    ] = await Promise.all([
      this.prisma.service.count({ where: { tenantId: this.tenantId } }),
      this.prisma.attendanceRecord.count({
        where: { tenantId: this.tenantId, present: true },
      }),
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
      this.prisma.member.count({
        where: { tenantId: this.tenantId, status: 'ACTIVE' },
      }),
    ]);

    const avgAttendance =
      totalServices > 0 ? Math.round(totalCheckins / totalServices) : 0;
    const momChange =
      lastMonthCheckins === 0
        ? 0
        : Math.round(
            ((thisMonthCheckins - lastMonthCheckins) / lastMonthCheckins) * 100,
          );

    return {
      totalServices,
      totalCheckins,
      thisMonthCheckins,
      lastMonthCheckins,
      avgAttendance,
      momChange,
      totalMembers,
      attendanceRate:
        totalMembers > 0 ? Math.round((avgAttendance / totalMembers) * 100) : 0,
    };
  }
}
