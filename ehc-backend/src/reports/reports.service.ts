import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';

const WAT = 60 * 60 * 1000;

function serviceKey(d: Date): string {
  const day = new Date(d.getTime() + WAT).getUTCDay();
  return day === 0 ? 'sunday' : day === 3 ? 'wednesday' : 'other';
}

function watDate(d: Date): string {
  return new Date(d.getTime() + WAT).toISOString().slice(0, 10);
}

function toXlsx(headers: string[], rows: (string | number | null)[][], sheetName = 'Attendance'): Buffer {
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  // Bold + auto-width for header row
  const colWidths = headers.map((h, ci) => ({
    wch: Math.max(h.length, ...rows.map((r) => String(r[ci] ?? '').length)) + 2,
  }));
  ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

@Injectable()
export class ReportsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private async fetchAttendanceRows(where: object) {
    return this.prisma.attendanceRecord.findMany({
      where: { tenantId: this.tenantId, ...where },
      include: {
        Member: { select: { firstName: true, lastName: true } },
        Service: { select: { name: true, scheduledAt: true } },
      },
      orderBy: { Service: { scheduledAt: 'desc' } },
    });
  }

  async monthlyReport(month: string) {
    const [y, m] = month.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    const rows = await this.fetchAttendanceRows({
      Service: { scheduledAt: { gte: start, lt: end } },
    });
    const headers = ['Member', 'Service', 'Date', 'Status'];
    const data = rows.map((r) => [
      `${r.Member.firstName} ${r.Member.lastName}`,
      r.Service.name,
      watDate(r.Service.scheduledAt),
      r.present ? 'PRESENT' : 'ABSENT',
    ]);
    return { buffer: toXlsx(headers, data, 'Monthly'), filename: `attendance-${month}.xlsx` };
  }

  async memberReport(memberId: string) {
    const rows = await this.fetchAttendanceRows({ memberId });
    const headers = ['Service', 'Date', 'Status'];
    const data = rows.map((r) => [
      r.Service.name,
      watDate(r.Service.scheduledAt),
      r.present ? 'PRESENT' : 'ABSENT',
    ]);
    return { buffer: toXlsx(headers, data, 'Member History'), filename: `member-history-${memberId}.xlsx` };
  }

  async rangeReport(from: string, to: string) {
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1);
    const rows = await this.fetchAttendanceRows({
      Service: { scheduledAt: { gte: new Date(from), lt: toDate } },
    });
    const headers = ['Member', 'Service', 'Date', 'Status'];
    const data = rows.map((r) => [
      `${r.Member.firstName} ${r.Member.lastName}`,
      r.Service.name,
      watDate(r.Service.scheduledAt),
      r.present ? 'PRESENT' : 'ABSENT',
    ]);
    return { buffer: toXlsx(headers, data, 'Date Range'), filename: `attendance-${from}_${to}.xlsx` };
  }

  async serviceComparison(period: string) {
    const [y, m] = period.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);

    const services = await this.prisma.service.findMany({
      where: { tenantId: this.tenantId, scheduledAt: { gte: start, lt: end } },
      include: { _count: { select: { AttendanceRecord: { where: { present: true } } } } },
    });

    const grouped: Record<string, { serviceName: string; present: number; total: number }> = {};
    for (const s of services) {
      const key = serviceKey(s.scheduledAt);
      const name = key === 'sunday' ? 'Sunday Service' : key === 'wednesday' ? 'Wednesday Service' : s.name;
      if (!grouped[key]) grouped[key] = { serviceName: name, present: 0, total: 0 };
      grouped[key].present += s._count.AttendanceRecord;
      grouped[key].total += await this.prisma.attendanceRecord.count({ where: { serviceId: s.id } });
    }

    return {
      period,
      services: Object.entries(grouped).map(([key, g]) => ({
        serviceKey: key,
        serviceName: g.serviceName,
        present: g.present,
        absent: g.total - g.present,
        total: g.total,
        rate: g.total > 0 ? Math.round((g.present / g.total) * 100) / 100 : 0,
      })),
    };
  }

  async serviceComparisonXlsx(period: string) {
    const data = await this.serviceComparison(period);
    const headers = ['Service', 'Present', 'Absent', 'Total', 'Rate (%)'];
    const rows = data.services.map((s) => [
      s.serviceName,
      s.present,
      s.absent,
      s.total,
      Math.round(s.rate * 100),
    ]);
    return { buffer: toXlsx(headers, rows, 'Service Comparison'), filename: `service-comparison-${period}.xlsx` };
  }
}
