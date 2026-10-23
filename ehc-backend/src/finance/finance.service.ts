import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FinanceEntryKind } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { UpsertServiceOfferingDto } from './dto/service-offering.dto';
import { CreateFinanceEntryDto, UpdateFinanceEntryDto } from './dto/finance-entry.dto';

// Services are scheduled for Nigeria time (WAT, UTC+1) but scheduledAt is
// stored in UTC, so a WAT-midnight service lands at 23:00 UTC the previous
// day. Week/month boundaries must be anchored to WAT — not the server's own
// time zone — or a Sunday/Wednesday service can fall just outside the range
// computed for "this week". Same convention as attendance.types.ts's
// WAT_OFFSET_MS.
const WAT_OFFSET_MS = 60 * 60 * 1000;

/** The UTC instant of WAT midnight on the given "yyyy-MM-dd" calendar day. */
function watMidnightUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day) - WAT_OFFSET_MS);
}

function dayRange(dateStr: string): { from: Date; to: Date } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const from = watMidnightUtc(y, m, d);
  const to = new Date(from.getTime() + 86_400_000 - 1); // end of this WAT day
  return { from, to };
}

function weekRange(dateStr: string): { from: Date; to: Date } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const midnight = watMidnightUtc(y, m, d);
  const watDay = new Date(midnight.getTime() + WAT_OFFSET_MS).getUTCDay();
  const from = new Date(midnight.getTime() - watDay * 86_400_000); // back up to Sunday, WAT
  const to = new Date(from.getTime() + 7 * 86_400_000 - 1); // end of Saturday, WAT
  return { from, to };
}

function monthRange(year: number, month: number): { from: Date; to: Date } {
  const from = watMidnightUtc(year, month, 1);
  const to = new Date(watMidnightUtc(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1, 1).getTime() - 1);
  return { from, to };
}

@Injectable()
export class FinanceService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  // ── Per-service tithe & offering ─────────────────────────────────────────

  async upsertServiceOffering(serviceId: string, dto: UpsertServiceOfferingDto, actorId: string | null) {
    const service = await this.prisma.service.findFirst({ where: { id: serviceId, tenantId: this.tenantId } });
    if (!service) throw new NotFoundException('Service not found');

    return this.prisma.serviceOffering.upsert({
      where: { serviceId },
      update: { tithe: dto.tithe, offering: dto.offering, note: dto.note?.trim() || null, recordedById: actorId },
      create: {
        id: randomUUID(),
        tenantId: this.tenantId,
        serviceId,
        tithe: dto.tithe,
        offering: dto.offering,
        note: dto.note?.trim() || null,
        recordedById: actorId,
      },
    });
  }

  async deleteServiceOffering(serviceId: string) {
    const result = await this.prisma.serviceOffering.deleteMany({ where: { serviceId, tenantId: this.tenantId } });
    if (result.count === 0) throw new NotFoundException('No offering recorded for this service');
    return { serviceId, deleted: true };
  }

  /** Every service in range, with its recorded offering if any (so the UI can show what's still unrecorded). */
  async listServicesWithOfferings(opts: { from?: Date; to?: Date }) {
    return this.prisma.service.findMany({
      where: {
        tenantId: this.tenantId,
        ...(opts.from || opts.to
          ? { scheduledAt: { ...(opts.from ? { gte: opts.from } : {}), ...(opts.to ? { lte: opts.to } : {}) } }
          : {}),
      },
      orderBy: { scheduledAt: 'desc' },
      take: 100,
      include: { ServiceOffering: true },
    });
  }

  // ── Income / expense entries ─────────────────────────────────────────────

  async createEntry(dto: CreateFinanceEntryDto, actorId: string | null) {
    return this.prisma.financeEntry.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        kind: dto.kind as FinanceEntryKind,
        category: dto.category.trim(),
        label: dto.label?.trim() || null,
        amount: dto.amount,
        date: new Date(`${dto.date}T12:00:00`), // noon — avoids a timezone rollover pushing the entry into the wrong day
        note: dto.note?.trim() || null,
        receiptUrl: dto.receiptUrl || null,
        recordedById: actorId,
      },
    });
  }

  async listEntries(opts: { from?: Date; to?: Date; kind?: FinanceEntryKind }) {
    return this.prisma.financeEntry.findMany({
      where: {
        tenantId: this.tenantId,
        ...(opts.kind ? { kind: opts.kind } : {}),
        ...(opts.from || opts.to
          ? { date: { ...(opts.from ? { gte: opts.from } : {}), ...(opts.to ? { lte: opts.to } : {}) } }
          : {}),
      },
      orderBy: { date: 'desc' },
    });
  }

  async updateEntry(id: string, dto: UpdateFinanceEntryDto) {
    const result = await this.prisma.financeEntry.updateMany({
      where: { id, tenantId: this.tenantId },
      data: {
        ...(dto.category !== undefined && { category: dto.category.trim() }),
        ...(dto.label !== undefined && { label: dto.label.trim() || null }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.date !== undefined && { date: new Date(`${dto.date}T12:00:00`) }),
        ...(dto.note !== undefined && { note: dto.note.trim() || null }),
        ...(dto.receiptUrl !== undefined && { receiptUrl: dto.receiptUrl || null }),
      },
    });
    if (result.count === 0) throw new NotFoundException('Entry not found');
    return this.prisma.financeEntry.findFirst({ where: { id, tenantId: this.tenantId } });
  }

  async deleteEntry(id: string) {
    const result = await this.prisma.financeEntry.deleteMany({ where: { id, tenantId: this.tenantId } });
    if (result.count === 0) throw new NotFoundException('Entry not found');
    return { id, deleted: true };
  }

  // ── Summaries ─────────────────────────────────────────────────────────────

  private async summarize(from: Date, to: Date) {
    const [services, incomeEntries, expenseEntries] = await Promise.all([
      this.prisma.service.findMany({
        where: { tenantId: this.tenantId, scheduledAt: { gte: from, lte: to } },
        orderBy: { scheduledAt: 'asc' },
        include: { ServiceOffering: true },
      }),
      this.prisma.financeEntry.findMany({
        where: { tenantId: this.tenantId, kind: FinanceEntryKind.INCOME, date: { gte: from, lte: to } },
      }),
      this.prisma.financeEntry.findMany({
        where: { tenantId: this.tenantId, kind: FinanceEntryKind.EXPENSE, date: { gte: from, lte: to } },
      }),
    ]);

    const titheTotal = services.reduce((sum, s) => sum + (s.ServiceOffering?.tithe ?? 0), 0);
    const offeringTotal = services.reduce((sum, s) => sum + (s.ServiceOffering?.offering ?? 0), 0);

    const groupByCategory = (entries: typeof incomeEntries) => {
      const map = new Map<string, number>();
      for (const e of entries) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
      return [...map.entries()].map(([category, amount]) => ({ category, amount }));
    };

    const incomeByCategory = groupByCategory(incomeEntries);
    const expenseByCategory = groupByCategory(expenseEntries);
    const incomeTotal = incomeByCategory.reduce((sum, c) => sum + c.amount, 0);
    const expenseTotal = expenseByCategory.reduce((sum, c) => sum + c.amount, 0);
    const grandIncomeTotal = titheTotal + offeringTotal + incomeTotal;

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        scheduledAt: s.scheduledAt.toISOString(),
        tithe: s.ServiceOffering?.tithe ?? null,
        offering: s.ServiceOffering?.offering ?? null,
        recorded: Boolean(s.ServiceOffering),
      })),
      titheTotal,
      offeringTotal,
      incomeByCategory,
      incomeTotal,
      expenseByCategory,
      expenseTotal,
      grandIncomeTotal,
      netTotal: grandIncomeTotal - expenseTotal,
    };
  }

  async getDailySummary(date: string) {
    const { from, to } = dayRange(date);
    return this.summarize(from, to);
  }

  /** `date` anchors the week — Sunday through Saturday containing it. */
  async getWeeklySummary(date: string) {
    const { from, to } = weekRange(date);
    return this.summarize(from, to);
  }

  async getMonthlySummary(year: number, month: number) {
    const { from, to } = monthRange(year, month);
    return this.summarize(from, to);
  }
}
