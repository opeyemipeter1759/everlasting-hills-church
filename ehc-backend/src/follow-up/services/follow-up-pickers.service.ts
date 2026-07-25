import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FollowUpSourceType, MemberStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { FollowUpAuthService } from './follow-up-auth.service';

/** "Add to Master List" candidate search and the assignee-picker team roster. */
@Injectable()
export class FollowUpPickersService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: FollowUpAuthService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async candidates(type: FollowUpSourceType, q: string) {
    const query = (q ?? '').trim();
    if (query.length < 2) return [];

    if (type === FollowUpSourceType.FIRST_TIMER) {
      const visitors = await this.prisma.visitor.findMany({
        where: {
          tenantId: this.tenantId,
          convertedAt: null,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        orderBy: [{ firstName: 'asc' }],
        take: 15,
      });
      return visitors.map((v) => ({
        id: v.id,
        name: `${v.firstName} ${v.lastName}`.trim(),
        photoUrl: null as string | null,
        phone: v.phone,
        email: v.email,
      }));
    }

    const members = await this.prisma.member.findMany({
      where: {
        tenantId: this.tenantId,
        status: MemberStatus.ACTIVE,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true, photoUrl: true },
      orderBy: [{ firstName: 'asc' }],
      take: 15,
    });
    return members.map((m) => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName}`.trim(),
      photoUrl: m.photoUrl,
      phone: m.phone,
      email: m.email,
    }));
  }

  async team(actor: AuthUser, requestedUnitId?: string) {
    const unitId = await this.auth.resolveActorUnitId(actor, requestedUnitId);
    const rows = await this.prisma.unitMember.findMany({
      where: { tenantId: this.tenantId, unitId },
      include: { Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
      orderBy: { Member: { firstName: 'asc' } },
    });
    return rows.map((r) => ({
      id: r.Member.id,
      name: `${r.Member.firstName} ${r.Member.lastName}`.trim(),
      photoUrl: r.Member.photoUrl,
      isLead: r.isLead,
    }));
  }
}
