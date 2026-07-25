import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as XLSX from 'xlsx';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { ListAttendanceQuery } from '../attendance.types';
import { AttendanceListService } from './attendance-list.service';

/** CSV export for a single service, and Excel export of the filtered attendance list. */
@Injectable()
export class AttendanceExportService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly listService: AttendanceListService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
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

  /** Excel export — GET /attendance/export */
  async exportAttendanceCsv(q: Omit<ListAttendanceQuery, 'page' | 'limit'>) {
    const result = await this.listService.listAttendance({ ...q, page: 1, limit: 10_000 });
    const headers = ['Member', 'Phone', 'Service', 'Date', 'Status', 'Marked By', 'Marked At'];
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
      wch: Math.max(h.length, ...rows.map((r) => String(r[ci] ?? '').length)) + 2,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
