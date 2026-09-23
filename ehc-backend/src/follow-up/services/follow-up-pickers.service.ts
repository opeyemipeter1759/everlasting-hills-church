import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FollowUpSourceType, MemberStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { FollowUpAuthService } from './follow-up-auth.service';
import { FollowUpAssignableService } from './follow-up-assignable.service';

/** "Add to Master List" candidate search and the assignee-picker team roster. */
@Injectable()
export class FollowUpPickersService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: FollowUpAuthService,
    private readonly assignable: FollowUpAssignableService,
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

  /**
   * The roster to pick an assignee from.
   *
   * With no unit asked for: the unit this person leads, or the Follow Up unit
   * for an admin or head of department who leads no team of their own, and
   * only then their own membership. Resolving by membership alone left the
   * picker empty for anyone not sitting in a unit — which is most leaders.
   */
  async team(actor: AuthUser, requestedUnitId?: string) {
    const unitId = requestedUnitId
      ? await this.auth.resolveActorUnitId(actor, requestedUnitId)
      : ((await this.auth.resolveMyUnit(actor))?.id ?? (await this.auth.resolveActorUnitId(actor)));
    const rows = await this.prisma.unitMember.findMany({
      where: { tenantId: this.tenantId, unitId },
      include: { Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
      orderBy: { Member: { firstName: 'asc' } },
    });
    // A Super Admin runs the system rather than carrying calls, so they are
    // never offered as someone to assign work to.
    return this.assignable.assignableOnly(
      rows.map((r) => ({
        id: r.Member.id,
        name: `${r.Member.firstName} ${r.Member.lastName}`.trim(),
        photoUrl: r.Member.photoUrl,
        isLead: r.isLead,
      })),
    );
  }
}
