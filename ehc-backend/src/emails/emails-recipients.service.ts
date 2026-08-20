import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { roleFilter } from '../members/members-directory.util';
import { ROLE_LABEL } from './emails.constants';
import type { Env } from '../config/env.validation';
import type { AudienceFilterDto } from './dto/audience-filter.dto';

export interface RecipientRow {
  id: string;
  email: string;
  name: string;
}

/**
 * Resolves an audience filter (all / a unit / an effective role / hand-picked
 * people) into the Members it matches. Mirrors MemberDirectoryQueryService's
 * where-clause construction so "who gets this email" always agrees with what
 * the People directory would show for the same role/unit filter.
 */
@Injectable()
export class EmailsRecipientsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private buildWhere(filter: AudienceFilterDto): Prisma.MemberWhereInput {
    const where: Prisma.MemberWhereInput = { tenantId: this.tenantId, email: { not: null } };

    switch (filter.mode) {
      case 'UNIT':
        where.UnitMember = { some: { unitId: filter.unitId } };
        break;
      case 'ROLE':
        where.Profile = { is: roleFilter(filter.role as Role) };
        break;
      case 'SPECIFIC':
        where.id = { in: filter.memberIds ?? [] };
        break;
      case 'ALL':
      default:
        break;
    }

    return where;
  }

  async resolve(filter: AudienceFilterDto): Promise<RecipientRow[]> {
    const rows = await this.prisma.member.findMany({
      where: this.buildWhere(filter),
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    return rows
      .filter((r): r is typeof r & { email: string } => Boolean(r.email))
      .map((r) => ({ id: r.id, email: r.email, name: `${r.firstName} ${r.lastName}`.trim() }));
  }

  /** Human-readable snapshot for EmailSend.audienceLabel and the frontend preview. */
  async describe(filter: AudienceFilterDto): Promise<string> {
    switch (filter.mode) {
      case 'UNIT': {
        if (!filter.unitId) return 'A unit';
        const unit = await this.prisma.unit.findUnique({ where: { id: filter.unitId }, select: { name: true } });
        return unit ? `Unit: ${unit.name}` : 'Unit';
      }
      case 'ROLE':
        return `Role: ${ROLE_LABEL[filter.role as Role] ?? filter.role}`;
      case 'SPECIFIC': {
        const count = filter.memberIds?.length ?? 0;
        return `${count} ${count === 1 ? 'person' : 'people'}`;
      }
      case 'ALL':
      default:
        return 'All members';
    }
  }
}
