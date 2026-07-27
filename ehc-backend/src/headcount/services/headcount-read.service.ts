import { ConfigService } from '@nestjs/config';
import { Injectable, NotFoundException } from '@nestjs/common';
import { HeadcountStatus, ServiceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { WAT_OFFSET_MS, toDto } from '../headcount.util';
import { HeadcountClockService } from './headcount-clock.service';
import { HeadcountDateService } from './headcount-date.service';

@Injectable()
export class HeadcountReadService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: HeadcountClockService,
    private readonly dateSvc: HeadcountDateService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async serviceOrThrow(serviceId: string) {
    const svc = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId: this.tenantId },
      select: { id: true, name: true, serviceType: true, scheduledAt: true, openAt: true, closeAt: true, isOpen: true },
    });
    if (!svc) throw new NotFoundException('Service not found');
    return svc;
  }

  /** The service + headcount for a chosen calendar date (service may not exist yet). */
  async getForDate(dateStr: string) {
    const svc = await this.dateSvc.findServiceForDate(dateStr);
    const hc = svc ? await this.prisma.serviceHeadcount.findUnique({ where: { serviceId: svc.id } }) : null;
    return {
      date: dateStr,
      inferredType: this.dateSvc.typeForWeekday(this.dateSvc.weekdayOf(dateStr)),
      canRecord: this.dateSvc.canRecordDate(dateStr),
      service: svc
        ? {
            id: svc.id,
            name: svc.name,
            serviceType: svc.serviceType,
            scheduledAt: svc.scheduledAt.toISOString(),
            state: this.clock.serviceState(svc),
          }
        : null,
      headcount: hc ? toDto(hc) : null,
    };
  }

  /** The headcount for a service (or null), plus the service and whether it can be recorded now. */
  async getForService(serviceId: string) {
    const svc = await this.serviceOrThrow(serviceId);
    const state = this.clock.serviceState(svc);
    const hc = await this.prisma.serviceHeadcount.findUnique({ where: { serviceId } });
    return {
      service: {
        id: svc.id,
        name: svc.name,
        serviceType: svc.serviceType,
        scheduledAt: svc.scheduledAt.toISOString(),
        state,
      },
      canRecord: state !== 'SCHEDULED',
      headcount: hc ? toDto(hc) : null,
    };
  }

  /** Recent confirmed + draft headcounts for the tenant, newest first, for the history view. */
  async getHistory(limit = 30) {
    const rows = await this.prisma.serviceHeadcount.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { Service: { scheduledAt: 'desc' } },
      take: Math.min(Math.max(limit, 1), 100),
      include: { Service: { select: { name: true, serviceType: true, scheduledAt: true } } },
    });
    return rows.map((hc) => ({
      ...toDto(hc),
      serviceName: hc.Service.name,
      serviceType: hc.Service.serviceType,
      serviceDate: hc.Service.scheduledAt.toISOString(),
    }));
  }

  /** Today's service headcount total (congregation-level "present today" number). */
  async getTodayHeadcount() {
    const now = this.clock.getNow();
    const localNow = new Date(now.getTime() + WAT_OFFSET_MS);
    const midnight = Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate());
    const startUtc = new Date(midnight - WAT_OFFSET_MS);
    const endUtc = new Date(startUtc.getTime() + 86_400_000);
    const svc = await this.prisma.service.findFirst({
      where: { tenantId: this.tenantId, scheduledAt: { gte: startUtc, lt: endUtc } },
      orderBy: { scheduledAt: 'desc' },
      select: { id: true },
    });
    if (!svc) return { total: null as number | null, headcount: null };
    const hc = await this.prisma.serviceHeadcount.findUnique({ where: { serviceId: svc.id } });
    return { total: hc?.total ?? null, headcount: hc ? toDto(hc) : null };
  }

  /**
   * Attendance trend from headcount totals. Points are chronological and tagged by
   * service type, so callers can compare like service to like service. Only
   * CONFIRMED headcounts count as authoritative. Includes the category breakdown
   * (men / women / children / first-timers) for the growth surface.
   */
  async getTrend(opts: { serviceType?: ServiceType; limit?: number } = {}) {
    const limit = Math.min(Math.max(opts.limit ?? 24, 1), 100);
    const rows = await this.prisma.serviceHeadcount.findMany({
      where: {
        tenantId: this.tenantId,
        status: HeadcountStatus.CONFIRMED,
        ...(opts.serviceType ? { Service: { serviceType: opts.serviceType } } : {}),
      },
      orderBy: { Service: { scheduledAt: 'desc' } },
      take: limit,
      include: { Service: { select: { name: true, serviceType: true, scheduledAt: true } } },
    });
    return rows
      .slice()
      .reverse()
      .map((hc) => ({
        id: hc.id,
        serviceType: hc.Service.serviceType,
        date: hc.Service.scheduledAt.toISOString(),
        label: hc.Service.scheduledAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' }),
        value: hc.total,
        men: hc.men,
        women: hc.women,
        children: hc.boys + hc.girls,
        firstTimers: hc.firstTimers,
      }));
  }
}
