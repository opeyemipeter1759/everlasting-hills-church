import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { ListAttendanceQuery } from '../attendance.types';
import { buildAttendanceOrderBy, buildAttendanceWhere, svcKey, watDateStr } from '../attendance-list.util';

/** Rows per page a caller may ask for. The Excel export passes its own, larger cap. */
const MAX_PAGE_SIZE = 200;

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

  async listAttendance(q: ListAttendanceQuery, maxPageSize = MAX_PAGE_SIZE) {
    const { name, status, serviceKey, serviceId, gender, year, month, date, dateFrom, dateTo, sortBy = 'date', sortOrder = 'DESC' } = q;
    const page = Math.max(1, Number(q.page ?? 1) || 1);
    const limit = Math.min(maxPageSize, Math.max(1, Number(q.limit ?? 20) || 20));

    const where = buildAttendanceWhere(this.tenantId, q);
    const orderBy = buildAttendanceOrderBy(sortBy, sortOrder);

    // Present/absent totals for everything the other filters match, so the
    // status tabs can show how many sit behind each one, not just this page.
    const [records, total, byStatus] = await Promise.all([
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
              gender: true,
            },
          },
          Service: { select: { id: true, name: true, scheduledAt: true } },
        },
      }),
      this.prisma.attendanceRecord.count({ where }),
      this.prisma.attendanceRecord.groupBy({
        by: ['present'],
        where: buildAttendanceWhere(this.tenantId, { ...q, status: undefined }),
        _count: { _all: true },
      }),
    ]);

    const data = records.map((r) => ({
      id: r.id,
      sessionId: r.serviceId,
      serviceName: r.Service.name,
      serviceKey: svcKey(r.Service.scheduledAt),
      date: watDateStr(r.Service.scheduledAt),
      userId: r.Member.id,
      userName: `${r.Member.firstName} ${r.Member.lastName}`,
      photoUrl: r.Member.photoUrl ?? null,
      phone: r.Member.phone ?? null,
      gender: r.Member.gender ? r.Member.gender.toUpperCase() : null,
      status: r.present ? 'PRESENT' : 'ABSENT',
      markedBy: (r.markedBy ?? 'SELF') as 'SELF' | 'ADMIN',
      markedAt: r.checkedInAt.toISOString(),
    }));

    const countOf = (present: boolean) => byStatus.find((g) => g.present === present)?._count._all ?? 0;

    return {
      data,
      filters: {
        name: name ?? null,
        status: status ?? null,
        serviceKey: serviceKey ?? null,
        serviceId: serviceId ?? null,
        gender: gender ?? null,
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
        presentCount: countOf(true),
        absentCount: countOf(false),
      },
    };
  }
}
