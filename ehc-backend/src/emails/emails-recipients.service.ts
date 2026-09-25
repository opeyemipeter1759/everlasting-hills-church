import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { roleFilter } from '../members/members-directory.util';
import { ROLE_LABEL } from './emails.constants';
import type { Env } from '../config/env.validation';
import type { AudienceFilterDto } from './dto/audience-filter.dto';

/** Role grants that make someone a leader for the WORKERS audience. */
const LEADER_GRANTS: Role[] = [Role.UNIT_LEAD, Role.HOD, Role.HEAD_USHER, Role.ADMIN, Role.ADMIN_HEAD, Role.PASTOR, Role.SUPER_ADMIN];

export interface RecipientRow {
  id: string;
  email: string;
  name: string;
  /** Used for the "Hello Daphne," greeting each recipient gets. */
  firstName: string;
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
    const where: Prisma.MemberWhereInput = {
      tenantId: this.tenantId,
      status: 'ACTIVE',
      email: { not: null },
    };

    switch (filter.mode) {
      case 'WORKERS':
        // "Workers" is anyone actually serving: on a unit's roster, or holding
        // any leadership post. Leaders are matched by their live assignments
        // rather than a UnitMember row because a unit lead or department head
        // isn't necessarily listed as a member of the unit they oversee.
        where.OR = [
          { UnitMember: { some: {} } },
          { Profile: { is: { UnitLeadOf: { some: { endedAt: null } } } } },
          { Profile: { is: { DepartmentHeadOf: { some: { endedAt: null } } } } },
          { Profile: { is: { DepartmentHodOf: { some: { endedAt: null } } } } },
          { Profile: { is: { HeadUsherOf: { some: { endedAt: null } } } } },
          { Profile: { is: { RoleGrantOf: { some: { endedAt: null, role: { in: LEADER_GRANTS } } } } } },
        ];
        break;
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
      .map((r) => ({ id: r.id, email: r.email, firstName: r.firstName, name: `${r.firstName} ${r.lastName}`.trim() }));
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
      case 'WORKERS':
        return 'All workers';
      case 'ALL':
      default:
        return 'All members';
    }
  }
}
