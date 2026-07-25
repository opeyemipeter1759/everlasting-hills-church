import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { DirectoryQuery } from '../members.types';
import { DIRECTORY_INCLUDE } from '../members.types';
import { directoryOrderBy, toPersonRow } from '../members-directory.util';
import { MemberDirectoryQueryService } from './member-directory-query.service';
import { MemberRoleResolverService } from './member-role-resolver.service';

/**
 * Powers the merged People console. Returns a paginated, filtered, sorted slice
 * of members joined with their role (Profile), units, engagement, attendance
 * count and care-assignment summary — plus tenant-wide counts for the stats
 * strip and role chips. Shaped as { data, meta } like AttendanceService.listAttendance.
 */
@Injectable()
export class MemberDirectoryService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly query: MemberDirectoryQueryService,
    private readonly roleResolver: MemberRoleResolverService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getDirectory(q: DirectoryQuery) {
    const page = Math.max(1, Number(q.page ?? 1) || 1);
    const limit = Math.min(200, Math.max(1, Number(q.limit ?? 50) || 50));

    const where = await this.query.buildWhere(q);
    const orderBy = directoryOrderBy(q.sortBy, q.sortOrder);

    const [rows, total, counts] = await Promise.all([
      this.prisma.member.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: DIRECTORY_INCLUDE,
      }),
      this.prisma.member.count({ where }),
      this.query.directoryCounts(),
    ]);

    const roleMap = await this.roleResolver.pageRoleMap(rows);
    return {
      data: rows.map((r) => toPersonRow(r, roleMap)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        counts,
      },
    };
  }
}
