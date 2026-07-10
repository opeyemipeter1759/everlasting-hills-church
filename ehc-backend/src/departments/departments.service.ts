import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Prisma, Role } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { InboxService } from '../inbox/inbox.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import {
  AssignHeadSchema,
  AssignUnitsSchema,
  CreateDepartmentSchema,
  DeptAnnouncementSchema,
  NudgeSchema,
  UpdateDepartmentSchema,
} from './dto/department.schema';

const MANAGE_ROLES: Role[] = [Role.ADMIN, Role.PASTOR, Role.SUPER_ADMIN];

type ProfileWithMember = {
  id: string;
  Member: { firstName: string; lastName: string; photoUrl: string | null } | null;
};

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
    private readonly inbox: InboxService,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private parse<T>(schema: z.ZodType<T>, raw: unknown): T {
    const r = schema.safeParse(raw);
    if (!r.success) {
      throw new BadRequestException({
        message: 'Invalid input',
        details: r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    return r.data;
  }

  private async deptOrThrow(id: string) {
    const dept = await this.prisma.department.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  private personLabel(p: ProfileWithMember | null) {
    if (!p) return null;
    const m = p.Member;
    return {
      profileId: p.id,
      name: m ? `${m.firstName} ${m.lastName}`.trim() : 'Unknown',
      photoUrl: m?.photoUrl ?? null,
    };
  }

  /** Distinct member counts per department (a member in two units counts once). */
  private async deptMemberCounts(): Promise<Map<string, number>> {
    const rows = await this.prisma.$queryRaw<{ departmentId: string; members: number }[]>`
      SELECT u."departmentId" AS "departmentId", COUNT(DISTINCT um."memberId")::int AS members
      FROM "UnitMember" um
      JOIN "Unit" u ON u.id = um."unitId"
      WHERE u."tenantId" = ${this.tenantId} AND u."departmentId" IS NOT NULL
      GROUP BY u."departmentId"`;
    return new Map(rows.map((r) => [r.departmentId, Number(r.members)]));
  }

  private async writeAudit(entry: {
    action: string;
    entity: string;
    entityId?: string | null;
    actorId?: string | null;
    before?: Prisma.InputJsonValue;
    after?: Prisma.InputJsonValue;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          actorId: entry.actorId ?? null,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId ?? null,
          before: entry.before ?? Prisma.DbNull,
          after: entry.after ?? Prisma.DbNull,
        },
      });
    } catch (err) {
      this.logger.error(`Audit write failed (${entry.action} ${entry.entity}): ${(err as Error).message}`);
    }
  }

  // ── Scope resolution (Admin Head) ────────────────────────────────────────────

  /** Department ids the actor actively heads (endedAt IS NULL). Empty if none. */
  private async myActiveDeptIds(actor: AuthUser): Promise<string[]> {
    if (!actor.profileId) return [];
    const rows = await this.prisma.departmentHead.findMany({
      where: { tenantId: this.tenantId, userId: actor.profileId, endedAt: null },
      select: { departmentId: true },
    });
    return rows.map((r) => r.departmentId);
  }

  /** Unit ids inside the departments the actor actively heads. */
  private async myUnitIds(actor: AuthUser): Promise<Set<string>> {
    const deptIds = await this.myActiveDeptIds(actor);
    if (!deptIds.length) return new Set();
    const units = await this.prisma.unit.findMany({
      where: { tenantId: this.tenantId, departmentId: { in: deptIds } },
      select: { id: true },
    });
    return new Set(units.map((u) => u.id));
  }

  /** Admins target any department; an Admin Head only the departments they head. */
  private async assertCanTargetDept(actor: AuthUser, deptId: string) {
    if (actor.role && MANAGE_ROLES.includes(actor.role)) return;
    const mine = await this.myActiveDeptIds(actor);
    if (!mine.includes(deptId)) {
      throw new ForbiddenException('This department is not one you head');
    }
  }

  // ── Admin: read ──────────────────────────────────────────────────────────────

  async list() {
    const [departments, unassignedUnits, memberCounts, activeHeads] = await Promise.all([
      this.prisma.department.findMany({
        where: { tenantId: this.tenantId },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { Units: true } } },
      }),
      this.prisma.unit.findMany({
        where: { tenantId: this.tenantId, departmentId: null },
        include: { _count: { select: { UnitMember: true } } },
        orderBy: { name: 'asc' },
      }),
      this.deptMemberCounts(),
      this.activeHeadsByDept(),
    ]);

    return {
      departments: departments.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        description: d.description,
        sortOrder: d.sortOrder,
        unitCount: d._count.Units,
        memberCount: memberCounts.get(d.id) ?? 0,
        head: activeHeads.get(d.id) ?? null,
      })),
      unassignedUnits: unassignedUnits.map((u) => ({
        id: u.id,
        name: u.name,
        memberCount: u._count.UnitMember,
      })),
    };
  }

  private async activeHeadsByDept() {
    const rows = await this.prisma.departmentHead.findMany({
      where: { tenantId: this.tenantId, endedAt: null },
      include: { User: { select: { id: true, Member: { select: { firstName: true, lastName: true, photoUrl: true } } } } },
    });
    const map = new Map<string, ReturnType<DepartmentsService['personLabel']>>();
    for (const r of rows) map.set(r.departmentId, this.personLabel(r.User));
    return map;
  }

  async getOne(id: string) {
    const dept = await this.deptOrThrow(id);
    const memberSelect = { id: true, firstName: true, lastName: true, email: true, photoUrl: true, status: true };
    const [units, heads, memberCounts] = await Promise.all([
      this.prisma.unit.findMany({
        where: { tenantId: this.tenantId, departmentId: id },
        include: {
          UnitMember: { where: { isLead: true }, include: { Member: { select: memberSelect } } },
          _count: { select: { UnitMember: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.departmentHead.findMany({
        where: { tenantId: this.tenantId, departmentId: id },
        orderBy: { assignedAt: 'desc' },
        include: {
          User: { select: { id: true, Member: { select: { firstName: true, lastName: true, photoUrl: true } } } },
          AssignedBy: { select: { id: true, Member: { select: { firstName: true, lastName: true, photoUrl: true } } } },
        },
      }),
      this.deptMemberCounts(),
    ]);

    const current = heads.find((h) => h.endedAt === null) ?? null;
    return {
      department: {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        description: dept.description,
        sortOrder: dept.sortOrder,
      },
      memberCount: memberCounts.get(id) ?? 0,
      currentHead: current ? { ...this.personLabel(current.User), assignedAt: current.assignedAt.toISOString() } : null,
      units: units.map((u) => ({
        id: u.id,
        name: u.name,
        memberCount: u._count.UnitMember,
        lead: u.UnitMember[0]?.Member ?? null,
      })),
      history: heads.map((h) => ({
        id: h.id,
        assignedAt: h.assignedAt.toISOString(),
        endedAt: h.endedAt ? h.endedAt.toISOString() : null,
        user: this.personLabel(h.User),
        assignedBy: h.AssignedBy ? this.personLabel(h.AssignedBy) : null,
      })),
    };
  }

  // ── Admin: CRUD ──────────────────────────────────────────────────────────────

  async create(actor: AuthUser, raw: unknown) {
    const dto = this.parse(CreateDepartmentSchema, raw);
    const exists = await this.prisma.department.findFirst({
      where: { tenantId: this.tenantId, code: dto.code },
      select: { id: true },
    });
    if (exists) throw new BadRequestException(`A department with code ${dto.code} already exists`);
    const dept = await this.prisma.department.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    await this.writeAudit({ action: 'CREATE', entity: 'Department', entityId: dept.id, actorId: actor.userId, after: { code: dept.code, name: dept.name } });
    return dept;
  }

  async update(actor: AuthUser, id: string, raw: unknown) {
    const dto = this.parse(UpdateDepartmentSchema, raw);
    const before = await this.deptOrThrow(id);
    const dept = await this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description ?? null }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
    await this.writeAudit({ action: 'UPDATE', entity: 'Department', entityId: id, actorId: actor.userId, before: { name: before.name }, after: { name: dept.name } });
    return dept;
  }

  async remove(actor: AuthUser, id: string) {
    const dept = await this.deptOrThrow(id);
    // Units fall back to unassigned via ON DELETE SET NULL. Head history rows are
    // removed with the department (ON DELETE CASCADE); the department is gone.
    await this.prisma.department.delete({ where: { id } });
    await this.writeAudit({ action: 'DELETE', entity: 'Department', entityId: id, actorId: actor.userId, before: { code: dept.code, name: dept.name } });
    return { id, deleted: true };
  }

  // ── Admin: head assignment (history-preserving) ──────────────────────────────

  async assignHead(actor: AuthUser, deptId: string, raw: unknown) {
    const dto = this.parse(AssignHeadSchema, raw);
    await this.deptOrThrow(deptId);

    const profile = await this.prisma.profile.findFirst({
      where: { id: dto.profileId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Person not found');

    const current = await this.prisma.departmentHead.findFirst({
      where: { tenantId: this.tenantId, departmentId: deptId, endedAt: null },
    });
    if (current && current.userId === dto.profileId) {
      return this.getOne(deptId); // already the head, no-op, no new tenure
    }

    // End the current tenure and open a new one atomically (the partial unique
    // index guarantees at most one active head per department).
    const row = await this.prisma.$transaction(async (tx) => {
      if (current) {
        await tx.departmentHead.update({ where: { id: current.id }, data: { endedAt: new Date() } });
      }
      return tx.departmentHead.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          departmentId: deptId,
          userId: dto.profileId,
          assignedById: actor.profileId ?? null,
        },
      });
    });

    // The ADMIN_HEAD effective role is derived from this active DepartmentHead row,
    // so no explicit role grant is needed; it applies on the person's next request.

    await this.writeAudit({
      action: 'ASSIGN_HEAD',
      entity: 'DepartmentHead',
      entityId: row.id,
      actorId: actor.userId,
      before: current ? { previousHeadProfileId: current.userId } : undefined,
      after: { departmentId: deptId, headProfileId: dto.profileId },
    });
    return this.getOne(deptId);
  }

  async removeHead(actor: AuthUser, deptId: string) {
    await this.deptOrThrow(deptId);
    const current = await this.prisma.departmentHead.findFirst({
      where: { tenantId: this.tenantId, departmentId: deptId, endedAt: null },
    });
    if (!current) throw new BadRequestException('This department has no active head');
    await this.prisma.departmentHead.update({ where: { id: current.id }, data: { endedAt: new Date() } });
    // Role is intentionally NOT demoted: the person keeps ADMIN_HEAD and sees an
    // empty Admin Head dashboard until reassigned.
    await this.writeAudit({ action: 'REMOVE_HEAD', entity: 'DepartmentHead', entityId: current.id, actorId: actor.userId, before: { headProfileId: current.userId } });
    return this.getOne(deptId);
  }

  // ── Admin: unit assignment ───────────────────────────────────────────────────

  async assignUnits(actor: AuthUser, deptId: string, raw: unknown) {
    const dto = this.parse(AssignUnitsSchema, raw);
    await this.deptOrThrow(deptId);
    const res = await this.prisma.unit.updateMany({
      where: { id: { in: dto.unitIds }, tenantId: this.tenantId },
      data: { departmentId: deptId },
    });
    await this.writeAudit({ action: 'ASSIGN_UNITS', entity: 'Department', entityId: deptId, actorId: actor.userId, after: { unitIds: dto.unitIds } });
    return { assigned: res.count };
  }

  async unassignUnit(actor: AuthUser, unitId: string) {
    const res = await this.prisma.unit.updateMany({
      where: { id: unitId, tenantId: this.tenantId },
      data: { departmentId: null },
    });
    if (!res.count) throw new NotFoundException('Unit not found');
    await this.writeAudit({ action: 'UNASSIGN_UNIT', entity: 'Unit', entityId: unitId, actorId: actor.userId });
    return { unitId, unassigned: true };
  }

  // ── Admin Head: scoped read ──────────────────────────────────────────────────

  async getMine(actor: AuthUser) {
    const deptIds = await this.myActiveDeptIds(actor);
    if (!deptIds.length) return { departments: [] };
    const memberSelect = { id: true, firstName: true, lastName: true, photoUrl: true };
    const [departments, memberCounts] = await Promise.all([
      this.prisma.department.findMany({
        where: { tenantId: this.tenantId, id: { in: deptIds } },
        orderBy: { sortOrder: 'asc' },
        include: {
          Units: {
            include: {
              UnitMember: { where: { isLead: true }, include: { Member: { select: memberSelect } } },
              _count: { select: { UnitMember: true } },
            },
            orderBy: { name: 'asc' },
          },
        },
      }),
      this.deptMemberCounts(),
    ]);
    return {
      departments: departments.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        description: d.description,
        memberCount: memberCounts.get(d.id) ?? 0,
        units: d.Units.map((u) => ({
          id: u.id,
          name: u.name,
          memberCount: u._count.UnitMember,
          lead: u.UnitMember[0]?.Member ?? null,
        })),
      })),
    };
  }

  async getMyUnitRoster(actor: AuthUser, unitId: string) {
    const unitIds = await this.myUnitIds(actor);
    if (!unitIds.has(unitId)) {
      throw new ForbiddenException('This unit is not in your department');
    }
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, tenantId: this.tenantId },
      include: {
        UnitMember: {
          include: { Member: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, photoUrl: true, status: true } } },
          orderBy: [{ isLead: 'desc' }, { isAssistant: 'desc' }, { joinedAt: 'asc' }],
        },
      },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    return {
      id: unit.id,
      name: unit.name,
      members: unit.UnitMember.map((um) => ({
        memberId: um.memberId,
        isLead: um.isLead,
        isAssistant: um.isAssistant,
        Member: um.Member,
      })),
    };
  }

  // ── Announcements + nudge (Admin + Admin Head) ───────────────────────────────

  async postDeptAnnouncement(actor: AuthUser, deptId: string, raw: unknown) {
    const dto = this.parse(DeptAnnouncementSchema, raw);
    const dept = await this.deptOrThrow(deptId);
    await this.assertCanTargetDept(actor, deptId);

    // Recipients = distinct member profiles in this department's units.
    const rows = await this.prisma.unitMember.findMany({
      where: { tenantId: this.tenantId, Unit: { departmentId: deptId } },
      select: { Member: { select: { profileId: true } } },
    });
    const profileIds = [...new Set(rows.map((r) => r.Member.profileId))];

    const delivered = await this.inbox.createMany(
      profileIds.map((profileId) => ({
        tenantId: this.tenantId,
        profileId,
        title: dto.title,
        body: dto.body,
        type: 'announcement',
        link: '/dashboard',
      })),
    );

    await this.prisma.announcement.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        title: dto.title,
        body: dto.body,
        audience: `dept:${dept.code}`,
        sendEmail: false,
        createdById: actor.userId,
        recipients: delivered,
      },
    });

    await this.writeAudit({ action: 'ANNOUNCE', entity: 'Department', entityId: deptId, actorId: actor.userId, after: { title: dto.title, recipients: delivered } });
    return { departmentId: deptId, recipients: delivered };
  }

  async nudgeLead(actor: AuthUser, unitId: string, raw: unknown) {
    const dto = this.parse(NudgeSchema, raw);
    const unitIds = await this.myUnitIds(actor);
    const isManager = actor.role && MANAGE_ROLES.includes(actor.role);
    if (!isManager && !unitIds.has(unitId)) {
      throw new ForbiddenException('This unit is not in your department');
    }
    const lead = await this.prisma.unitMember.findFirst({
      where: { tenantId: this.tenantId, unitId, OR: [{ isLead: true }, { isAssistant: true }] },
      orderBy: { isLead: 'desc' },
      include: { Member: { select: { profileId: true, firstName: true } }, Unit: { select: { name: true } } },
    });
    if (!lead) return { notified: 0, message: 'This unit has no lead to nudge' };

    const delivered = await this.inbox.createMany([
      {
        tenantId: this.tenantId,
        profileId: lead.Member.profileId,
        title: `Reminder for ${lead.Unit.name}`,
        body: dto.message?.trim() || `A reminder from your department head regarding ${lead.Unit.name}.`,
        type: 'nudge',
        link: '/dashboard/unit-lead',
      },
    ]);
    await this.writeAudit({ action: 'NUDGE', entity: 'Unit', entityId: unitId, actorId: actor.userId, after: { leadProfileId: lead.Member.profileId } });
    return { notified: delivered };
  }
}
