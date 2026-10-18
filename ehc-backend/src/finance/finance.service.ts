import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FinanceEntryKind } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { UpsertServiceOfferingDto } from './dto/service-offering.dto';
import { CreateFinanceEntryDto, UpdateFinanceEntryDto } from './dto/finance-entry.dto';

function weekRange(dateStr: string): { from: Date; to: Date } {
  const d = new Date(`${dateStr}T00:00:00`);
  const from = new Date(d);
  from.setDate(d.getDate() - d.getDay()); // back up to Sunday
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function monthRange(year: number, month: number): { from: Date; to: Date } {
  const from = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const to = new Date(year, month, 0, 23, 59, 59, 999); // day 0 of next month = last day of this one
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
