import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { ListAttendanceQuery } from '../attendance.types';
import { buildAttendanceOrderBy, buildAttendanceWhere, svcKey, watDateStr } from '../attendance-list.util';

/** Filtered/sorted/paginated attendance list — backs GET /attendance and the Excel export. */
@Injectable()
export class AttendanceListService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async listAttendance(q: ListAttendanceQuery) {
    const { name, status, serviceKey, year, month, date, dateFrom, dateTo, sortBy = 'date', sortOrder = 'DESC' } = q;
    const page = Math.max(1, Number(q.page ?? 1) || 1);
    const limit = Math.min(200, Math.max(1, Number(q.limit ?? 20) || 20));

    const where = buildAttendanceWhere(this.tenantId, q);
    const orderBy = buildAttendanceOrderBy(sortBy, sortOrder);

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
      ? records.filter((r) => svcKey(r.Service.scheduledAt) === serviceKey)
      : records;

    const data = filtered.map((r) => ({
      id: r.id,
      sessionId: r.serviceId,
      serviceName: r.Service.name,
      serviceKey: svcKey(r.Service.scheduledAt),
      date: watDateStr(r.Service.scheduledAt),
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
}
