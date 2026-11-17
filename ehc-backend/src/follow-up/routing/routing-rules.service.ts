import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FollowUpStage, MemberStatus, Prisma, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { parseSchema } from '../../common/zod-parse.util';
import { createRoutingRuleSchema, updateRoutingRuleSchema } from './routing-rules.schema';

type Tx = Prisma.TransactionClient;

export interface RoutingRuleView {
  id: string;
  name: string;
  segment: string;
  unitId: string;
  unitName: string | null;
  strategy: string;
  priority: number;
  active: boolean;
  pool: { memberId: string; name: string; active: boolean; openLoad: number }[];
}

export interface RoutingOptions {
  units: { id: string; name: string; members: { id: string; name: string }[] }[];
}

/** Admin editing of routing rules: who new first-timers go to. People are data, edited here, never named in code. */
@Injectable()
export class RoutingRulesService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async list(): Promise<RoutingRuleView[]> {
    const rules = await this.prisma.routingRule.findMany({
      where: { tenantId: this.tenantId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      include: { Members: { select: { memberId: true } } },
    });
    const memberIds = [...new Set(rules.flatMap((r) => r.Members.map((m) => m.memberId)))];
    const [units, members, loads] = await Promise.all([
      this.prisma.unit.findMany({ where: { tenantId: this.tenantId, id: { in: rules.map((r) => r.unitId) } }, select: { id: true, name: true } }),
      this.prisma.member.findMany({ where: { id: { in: memberIds } }, select: { id: true, firstName: true, lastName: true, status: true } }),
      this.prisma.followUpEntry.groupBy({
        by: ['assigneeId'],
        where: { tenantId: this.tenantId, assigneeId: { in: memberIds }, stage: { notIn: [FollowUpStage.CONFIRMED, FollowUpStage.OPTED_OUT] } },
        _count: { _all: true },
      }),
    ]);
    const unitName = new Map(units.map((u) => [u.id, u.name]));
    const member = new Map(members.map((m) => [m.id, m]));
    const load = new Map(loads.map((l) => [l.assigneeId, l._count._all]));
    return rules.map((r) => ({
      id: r.id,
      name: r.name,
      segment: r.segment,
      unitId: r.unitId,
      unitName: unitName.get(r.unitId) ?? null,
      strategy: r.strategy,
      priority: r.priority,
      active: r.active,
      pool: r.Members.map(({ memberId }) => {
        const m = member.get(memberId);
        return {
          memberId,
          name: m ? `${m.firstName} ${m.lastName}`.trim() : 'Unknown member',
          active: m?.status === MemberStatus.ACTIVE,
          openLoad: load.get(memberId) ?? 0,
        };
      }),
    }));
  }

  /** Units and their active members, for the pool picker. */
  async options(): Promise<RoutingOptions> {
    const units = await this.prisma.unit.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        UnitMember: {
          where: { Member: { status: MemberStatus.ACTIVE } },
          select: { Member: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    return {
      units: units.map((u) => ({
        id: u.id,
        name: u.name,
        members: u.UnitMember.map(({ Member: m }) => ({ id: m.id, name: `${m.firstName} ${m.lastName}`.trim() })).sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      })),
    };
  }

  async create(actor: AuthUser, raw: unknown): Promise<RoutingRuleView[]> {
    const input = parseSchema(createRoutingRuleSchema, raw);
    const id = randomUUID();
    await this.prisma.$transaction(async (tx) => {
      await this.checkPool(tx, input.unitId, input.memberIds);
      await tx.routingRule.create({
        data: {
          id, tenantId: this.tenantId, name: input.name, segment: input.segment, unitId: input.unitId,
          priority: input.priority ?? 0, active: input.active ?? true,
          Members: { create: [...new Set(input.memberIds)].map((memberId) => ({ id: randomUUID(), memberId })) },
        },
      });
      await this.auditRow(tx, actor, 'CREATE', id, null, input);
    });
    return this.list();
  }

  /** Only the fields sent change; the pool, when sent, is replaced as a whole. */
  async update(actor: AuthUser, id: string, raw: unknown): Promise<RoutingRuleView[]> {
    const input = parseSchema(updateRoutingRuleSchema, raw);
    await this.prisma.$transaction(async (tx) => {
      const rule = await tx.routingRule.findFirst({ where: { id, tenantId: this.tenantId }, include: { Members: { select: { memberId: true } } } });
      if (!rule) throw new NotFoundException('Routing rule not found');
      const unitId = input.unitId ?? rule.unitId;
      const pool = input.memberIds ?? rule.Members.map((m) => m.memberId);
      if (input.unitId !== undefined || input.memberIds !== undefined) await this.checkPool(tx, unitId, pool);

      await tx.routingRule.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.unitId !== undefined ? { unitId: input.unitId } : {}),
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
          ...(input.active !== undefined ? { active: input.active } : {}),
        },
      });
      if (input.memberIds !== undefined) {
        const wanted = new Set(input.memberIds);
        await tx.routingRuleMember.deleteMany({ where: { ruleId: id, memberId: { notIn: [...wanted] } } });
        const have = new Set(rule.Members.map((m) => m.memberId));
        const add = [...wanted].filter((m) => !have.has(m));
        if (add.length) await tx.routingRuleMember.createMany({ data: add.map((memberId) => ({ id: randomUUID(), ruleId: id, memberId })) });
      }
      const before = { name: rule.name, unitId: rule.unitId, active: rule.active, priority: rule.priority, memberIds: rule.Members.map((m) => m.memberId) };
      await this.auditRow(tx, actor, 'UPDATE', id, before, input);
    });
    return this.list();
  }

  /** Everyone in a pool must be an active member of the rule's unit, the unit the assignment will sit under. */
  private async checkPool(tx: Tx, unitId: string, memberIds: string[]) {
    const unit = await tx.unit.findFirst({ where: { id: unitId, tenantId: this.tenantId }, select: { id: true } });
    if (!unit) throw new BadRequestException('That unit was not found');
    const ids = [...new Set(memberIds)];
    if (ids.length === 0) return;
    const inUnit = await tx.unitMember.findMany({
      where: { tenantId: this.tenantId, unitId, memberId: { in: ids }, Member: { status: MemberStatus.ACTIVE } },
      select: { memberId: true },
    });
    if (inUnit.length !== ids.length) throw new BadRequestException('Everyone in the pool must be an active member of the unit');
    const superAdmins = await tx.member.count({
      where: { id: { in: ids }, Profile: { RoleGrantOf: { some: { role: Role.SUPER_ADMIN, endedAt: null } } } },
    });
    if (superAdmins > 0) throw new BadRequestException('A Super Admin cannot be given follow-up work');
  }

  private auditRow(tx: Tx, actor: AuthUser, action: string, id: string, before: object | null, after: object) {
    return tx.auditLog.create({
      data: {
        id: randomUUID(), tenantId: this.tenantId, actorId: actor.userId, action, entity: 'RoutingRule', entityId: id,
        before: before ? (before as Prisma.InputJsonValue) : Prisma.DbNull,
        after: after as Prisma.InputJsonValue,
      },
    });
  }
}
