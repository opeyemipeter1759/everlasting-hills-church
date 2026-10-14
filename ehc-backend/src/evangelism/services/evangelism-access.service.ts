import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemberStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { EVANGELISM_ADMIN_ROLES, type EvangelismViewer } from '../evangelism.types';
import { evangelismTally, type EvangelismTally } from '../evangelism-tally';

/** Unit names are typed by admins: "Evangelism Team", "Evangelism Unit", "EVANGELISM" all count. */
export function isEvangelismUnitName(name: string | null | undefined): boolean {
  return typeof name === 'string' && name.toLowerCase().replace(/[^a-z]/g, '').includes('evangelis');
}

/**
 * Who may use the Evangelism pages, and who runs them.
 *
 * The team is the Evangelism unit's roster — adding or removing someone there
 * is what gives or takes away access. Its lead and assistant, the head of the
 * department it sits in (Growth & Outreach), and church admins can do
 * everything; everyone else on the team can view, add records, log follow-ups
 * and work the tasks given to them.
 */
@Injectable()
export class EvangelismAccessService {
  private readonly tenantId: string;
  /** The public site, for links in emails. */
  readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl = (config.get('FRONTEND_URL', { infer: true }) ?? 'https://www.everlastinghills.church').replace(/\/$/, '');
  }

  async findUnit(): Promise<{ id: string; departmentId: string | null } | null> {
    const units = await this.prisma.unit.findMany({
      where: { tenantId: this.tenantId, name: { contains: 'vangel', mode: 'insensitive' } },
      select: { id: true, name: true, departmentId: true },
      orderBy: { createdAt: 'asc' },
    });
    const unit = units.find((u) => isEvangelismUnitName(u.name));
    return unit ? { id: unit.id, departmentId: unit.departmentId } : null;
  }

  /** The viewer, or 403 when they are not on the team and don't run it. */
  async viewer(actor: AuthUser): Promise<EvangelismViewer> {
    const unit = await this.findUnit();
    if (!unit) throw new NotFoundException('There is no Evangelism unit yet. Create one under Growth & Outreach.');

    const admin = (actor.effectiveRoles ?? []).some((r) => EVANGELISM_ADMIN_ROLES.includes(r));
    const leadsUnit = actor.unitLeadOf?.includes(unit.id) ?? false;
    const headsDepartment = !!unit.departmentId && (actor.hodOf?.includes(unit.departmentId) ?? false);

    const [seat, member] = await Promise.all([
      actor.memberId
        ? this.prisma.unitMember.findFirst({
            where: { unitId: unit.id, memberId: actor.memberId },
            select: { isLead: true, isAssistant: true },
          })
        : null,
      actor.memberId
        ? this.prisma.member.findUnique({ where: { id: actor.memberId }, select: { firstName: true, lastName: true } })
        : null,
    ]);

    const canLead = admin || leadsUnit || headsDepartment || !!seat?.isLead || !!seat?.isAssistant;
    if (!canLead && !seat) throw new ForbiddenException('Evangelism is for the Evangelism Team.');

    return {
      unitId: unit.id,
      departmentId: unit.departmentId,
      canLead,
      memberId: actor.memberId ?? null,
      profileId: actor.profileId ?? null,
      name: member ? `${member.firstName} ${member.lastName}`.trim() : actor.email,
    };
  }

  /** The viewer, or 403 unless they run the team. */
  async leader(actor: AuthUser): Promise<EvangelismViewer> {
    const v = await this.viewer(actor);
    if (!v.canLead) throw new ForbiddenException('Only the Evangelism unit leader or an admin can do that.');
    return v;
  }

  /**
   * Active members whose first or last name starts a word in what was typed,
   * for the public form. Names only, a handful at a time, and nothing until two
   * letters are typed, so the form never hands out the church roll.
   */
  async searchMembers(query: string): Promise<{ id: string; name: string }[]> {
    const terms = query.trim().split(/\s+/).filter((t) => t.length >= 2).slice(0, 3);
    if (terms.length === 0) return [];
    const rows = await this.prisma.member.findMany({
      where: {
        tenantId: this.tenantId,
        status: MemberStatus.ACTIVE,
        AND: terms.map((t) => ({
          OR: [
            { firstName: { startsWith: t, mode: 'insensitive' as const } },
            { lastName: { startsWith: t, mode: 'insensitive' as const } },
          ],
        })),
      },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      take: 10,
    });
    return rows.map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}`.trim() }));
  }

  /** How many people a member has preached to and seen saved. */
  tally(memberId: string): Promise<EvangelismTally> {
    return evangelismTally(this.prisma, this.tenantId, memberId);
  }

  /** Current team, for pickers and the performance table. */
  async team(unitId: string) {
    const rows = await this.prisma.unitMember.findMany({
      where: { unitId },
      select: {
        isLead: true,
        isAssistant: true,
        Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
      },
    });
    return rows
      .map((r) => ({
        id: r.Member.id,
        name: `${r.Member.firstName} ${r.Member.lastName}`.trim(),
        photoUrl: r.Member.photoUrl,
        isLead: r.isLead,
        isAssistant: r.isAssistant,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Names for a set of member ids (workers, assignees) — whoever they are now. */
  async names(ids: (string | null | undefined)[]): Promise<Map<string, { name: string; photoUrl: string | null }>> {
    const unique = [...new Set(ids.filter((id): id is string => !!id))];
    if (unique.length === 0) return new Map();
    const members = await this.prisma.member.findMany({
      where: { id: { in: unique } },
      select: { id: true, firstName: true, lastName: true, photoUrl: true },
    });
    return new Map(members.map((m) => [m.id, { name: `${m.firstName} ${m.lastName}`.trim(), photoUrl: m.photoUrl }]));
  }

  get tenant(): string {
    return this.tenantId;
  }
}
