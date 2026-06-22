import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import type { Env } from '../config/env.validation';

const WAT = 60 * 60 * 1000;

function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function watDay(d: Date) {
  return new Date(d.getTime() + WAT).getUTCDay();
}

function serviceKey(d: Date): string {
  const day = watDay(d);
  return day === 0 ? 'sunday' : day === 3 ? 'wednesday' : 'other';
}

function todayBounds() {
  const wat = new Date(Date.now() + WAT);
  const startUtc = new Date(
    Date.UTC(wat.getUTCFullYear(), wat.getUTCMonth(), wat.getUTCDate()) - WAT,
  );
  return { startUtc, endUtc: new Date(startUtc.getTime() + 86_400_000) };
}

@Injectable()
export class SessionsService implements OnModuleInit {
  private readonly logger = new Logger(SessionsService.name);
  private readonly tenantId: string;
  private lastAutoClosedServiceId: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly attendanceService: AttendanceService,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  onModuleInit() {
    // Run immediately so a FORCE_OPEN toggle + server restart auto-marks absent right away.
    void this.checkAndAutoClose();
    // Also poll every 90 seconds for time-based closes.
    setInterval(() => void this.checkAndAutoClose(), 90_000);
  }

  private isWindowOpen(): boolean {
    const forceOpen = this.config.get('ATTENDANCE_FORCE_OPEN', { infer: true });
    if (forceOpen === true) return true;

    const wat = new Date(Date.now() + WAT);
    const day = wat.getUTCDay();
    const min = wat.getUTCHours() * 60 + wat.getUTCMinutes();

    if (day === 0) {
      const o = parseHHMM(this.config.get('ATTENDANCE_SUNDAY_OPEN', { infer: true }));
      const c = parseHHMM(this.config.get('ATTENDANCE_SUNDAY_CLOSE', { infer: true }));
      return min >= o && min < c;
    }
    if (day === 3) {
      const o = parseHHMM(this.config.get('ATTENDANCE_WEDNESDAY_OPEN', { infer: true }));
      const c = parseHHMM(this.config.get('ATTENDANCE_WEDNESDAY_CLOSE', { infer: true }));
      return min >= o && min < c;
    }
    return false;
  }

  private async checkAndAutoClose() {
    try {
      const open = this.isWindowOpen();
      if (open) return; // Session is currently open — nothing to close

      const { startUtc, endUtc } = todayBounds();
      const service = await this.prisma.service.findFirst({
        where: { tenantId: this.tenantId, scheduledAt: { gte: startUtc, lt: endUtc } },
      });
      if (!service) return;
      if (service.id === this.lastAutoClosedServiceId) return; // Already processed this service

      // Only auto-mark if at least one member checked in — avoids touching services
      // that were never actually used (e.g. a service row created then session never opened).
      const presentCount = await this.prisma.attendanceRecord.count({
        where: { serviceId: service.id, tenantId: this.tenantId, present: true },
      });
      if (presentCount === 0) return;

      this.lastAutoClosedServiceId = service.id;
      const { marked } = await this.attendanceService.markMissingAsAbsent(service.id);
      this.logger.log(`Session closed: marked ${marked} members absent for service ${service.id}`);
    } catch (err) {
      this.logger.warn(`Auto-close failed: ${(err as Error).message}`);
    }
  }

  /** Called by the admin via POST /sessions/close — marks all missing members absent for today's service. */
  async closeSession(): Promise<{ serviceId: string | null; marked: number }> {
    const { startUtc, endUtc } = todayBounds();
    const service = await this.prisma.service.findFirst({
      where: { tenantId: this.tenantId, scheduledAt: { gte: startUtc, lt: endUtc } },
    });
    if (!service) return { serviceId: null, marked: 0 };

    this.lastAutoClosedServiceId = service.id;
    const { marked } = await this.attendanceService.markMissingAsAbsent(service.id);
    return { serviceId: service.id, marked };
  }

  async getBanner() {
    const forceOpen = this.config.get('ATTENDANCE_FORCE_OPEN', { infer: true });
    const now = new Date();
    const wat = new Date(now.getTime() + WAT);
    const day = wat.getUTCDay();
    const min = wat.getUTCHours() * 60 + wat.getUTCMinutes();

    let sessionOpen = forceOpen === true;
    let closeMin = 0;

    if (forceOpen !== true) {
      if (day === 0) {
        const o = parseHHMM(this.config.get('ATTENDANCE_SUNDAY_OPEN', { infer: true }));
        closeMin = parseHHMM(this.config.get('ATTENDANCE_SUNDAY_CLOSE', { infer: true }));
        sessionOpen = min >= o && min < closeMin;
      } else if (day === 3) {
        const o = parseHHMM(this.config.get('ATTENDANCE_WEDNESDAY_OPEN', { infer: true }));
        closeMin = parseHHMM(this.config.get('ATTENDANCE_WEDNESDAY_CLOSE', { infer: true }));
        sessionOpen = min >= o && min < closeMin;
      }
    }

    if (!sessionOpen) {
      const next = await this.prisma.service.findFirst({
        where: { tenantId: this.tenantId, scheduledAt: { gt: now } },
        orderBy: { scheduledAt: 'asc' },
      });
      return {
        hasActiveSession: false,
        session: null,
        nextSession: next
          ? {
              serviceName: next.name,
              serviceKey: serviceKey(next.scheduledAt),
              opensAt: next.scheduledAt.toISOString(),
            }
          : null,
      };
    }

    const { startUtc, endUtc } = todayBounds();
    // When force-open, create the service row if it doesn't exist yet (e.g. non-service day).
    const service =
      forceOpen === true
        ? await this.attendanceService.findOrCreateTodayService()
        : await this.prisma.service.findFirst({
            where: { tenantId: this.tenantId, scheduledAt: { gte: startUtc, lt: endUtc } },
          });
    if (!service) return { hasActiveSession: false, session: null, nextSession: null };

    const checkedInCount = await this.prisma.attendanceRecord.count({
      where: { serviceId: service.id, tenantId: this.tenantId, present: true },
    });

    const sKey = serviceKey(service.scheduledAt);
    const watDate = new Date(service.scheduledAt.getTime() + WAT);
    const closesAt = new Date(
      Date.UTC(watDate.getUTCFullYear(), watDate.getUTCMonth(), watDate.getUTCDate(), 0, closeMin || 780) - WAT,
    );

    return {
      hasActiveSession: true,
      session: {
        id: service.id,
        serviceName: service.name,
        serviceKey: sKey,
        date: watDate.toISOString().slice(0, 10),
        closesAt: closesAt.toISOString(),
        checkedInCount,
      },
      nextSession: null,
    };
  }
}
