import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../../prisma/prisma.service';
import type { DirectoryQuery } from '../members.types';
import { DIRECTORY_INCLUDE } from '../members.types';
import { directoryOrderBy, toPersonRow } from '../members-directory.util';
import { MemberDirectoryQueryService } from './member-directory-query.service';
import { MemberRoleResolverService } from './member-role-resolver.service';

/** Excel export of the People directory, honoring the same filters as getDirectory (no pagination). */
@Injectable()
export class MemberExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly query: MemberDirectoryQueryService,
    private readonly roleResolver: MemberRoleResolverService,
  ) {}

  async exportDirectory(q: DirectoryQuery): Promise<Buffer> {
    const where = await this.query.buildWhere(q);
    const rows = await this.prisma.member.findMany({
      where,
      orderBy: directoryOrderBy(q.sortBy, q.sortOrder),
      include: DIRECTORY_INCLUDE,
      take: 20_000,
    });
    const roleMap = await this.roleResolver.pageRoleMap(rows);
    const people = rows.map((r) => toPersonRow(r, roleMap));

    const headers = [
      'First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'Role',
      'Status', 'Units', 'Tags', 'Birthday', 'Address', 'Joined', 'Shepherded By',
    ];
    const body = people.map((p) => [
      p.firstName,
      p.lastName,
      p.email ?? '',
      p.phone ?? '',
      p.gender ?? '',
      p.role,
      p.status,
      p.units.map((u) => u.name).join('; '),
      p.tags.join('; '),
      p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
      p.address ?? '',
      p.joinedAt.slice(0, 10),
      p.shepherdedBy.map((s) => s.leaderName).join('; '),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...body]);
    ws['!cols'] = headers.map((h, ci) => ({
      wch: Math.max(h.length, ...body.map((r) => String(r[ci] ?? '').length)) + 2,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'People');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
