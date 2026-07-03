import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import type { AssignUnitMemberDto, CreateUnitDto, SetMemberRoleDto, UpdateUnitDto } from './dto/unit.dto';

const ADMIN_ROLES: Role[] = [Role.ADMIN, Role.PASTOR, Role.SUPER_ADMIN];

@Injectable()
export class UnitsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  // ── Self ────────────────────────────────────────────────────────────────────

  async findMyUnit(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { Member: { select: { id: true } } },
    });
    if (!profile?.Member) return null;

    const membership = await this.prisma.unitMember.findFirst({
      where: {
        memberId: profile.Member.id,
        OR: [{ isLead: true }, { isAssistant: true }],
      },
      include: {
        Unit: { include: { _count: { select: { UnitMember: true } } } },
      },
    });
    if (!membership) return null;

    return {
      id: membership.Unit.id,
      name: membership.Unit.name,
      description: membership.Unit.description,
      totalMembers: membership.Unit._count.UnitMember,
      isLead: membership.isLead,
      isAssistant: membership.isAssistant,
    };
  }

  // ── Admin CRUD ──────────────────────────────────────────────────────────────

  async listAll() {
    const units = await this.prisma.unit.findMany({
      where: { tenantId: this.tenantId },
      include: {
        UnitMember: {
          where: { OR: [{ isLead: true }, { isAssistant: true }] },
          include: {
            Member: {
              select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true },
            },
          },
        },
        _count: { select: { UnitMember: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return units.map((u) => ({
      id: u.id,
      tenantId: u.tenantId,
      name: u.name,
      description: u.description,
      createdAt: u.createdAt,
      _count: { UnitMember: u._count.UnitMember },
      lead: u.UnitMember.find((m) => m.isLead)?.Member ?? null,
      assistant: u.UnitMember.find((m) => m.isAssistant)?.Member ?? null,
    }));
  }

  async getById(unitId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, tenantId: this.tenantId },
      include: {
        UnitMember: {
          include: {
            Member: {
              select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true, status: true },
            },
          },
          orderBy: [{ isLead: 'desc' }, { isAssistant: 'desc' }, { joinedAt: 'asc' }],
        },
        _count: { select: { UnitMember: true } },
      },
    });
    if (!unit) throw new NotFoundException('Unit not found');

    return {
      id: unit.id,
      tenantId: unit.tenantId,
      name: unit.name,
      description: unit.description,
      createdAt: unit.createdAt,
      _count: { UnitMember: unit._count.UnitMember },
      UnitMember: unit.UnitMember.map((um) => ({
        id: um.id,
        memberId: um.memberId,
        isLead: um.isLead,
        isAssistant: um.isAssistant,
        Member: {
          id: um.Member.id,
          firstName: um.Member.firstName,
          lastName: um.Member.lastName,
          email: um.Member.email,
          photoUrl: um.Member.photoUrl,
          status: um.Member.status,
        },
      })),
    };
  }

  async create(data: CreateUnitDto) {
    return this.prisma.unit.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        name: data.name.trim(),
        description: data.description?.trim() ?? null,
      },
    });
  }

  async update(unitId: string, data: UpdateUnitDto) {
    const exists = await this.prisma.unit.findFirst({
      where: { id: unitId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Unit not found');
    return this.prisma.unit.update({
      where: { id: unitId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() ?? null }),
      },
    });
  }

  async delete(unitId: string) {
    const result = await this.prisma.unit.deleteMany({
      where: { id: unitId, tenantId: this.tenantId },
    });
    if (result.count === 0) throw new NotFoundException('Unit not found');
    return { id: unitId, deleted: true };
  }

  // ── Member assignment ──────────────────────────────────────────────────────

  async addMember(actor: AuthUser, unitId: string, data: AssignUnitMemberDto) {
    await this.assertCanManageUnit(actor, unitId);

    const member = await this.prisma.member.findFirst({
      where: { id: data.memberId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (data.isLead && data.isAssistant) {
      throw new BadRequestException('A member cannot be both lead and assistant');
    }

    try {
      const um = await this.prisma.unitMember.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          unitId,
          memberId: data.memberId,
          isLead: data.isLead ?? false,
          isAssistant: data.isAssistant ?? false,
        },
        include: {
          Member: {
            select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true, status: true },
          },
        },
      });
      return {
        id: um.id,
        memberId: um.memberId,
        isLead: um.isLead,
        isAssistant: um.isAssistant,
        Member: {
          id: um.Member.id,
          firstName: um.Member.firstName,
          lastName: um.Member.lastName,
          email: um.Member.email,
          photoUrl: um.Member.photoUrl,
          status: um.Member.status,
        },
      };
    } catch {
      throw new BadRequestException('Member is already in this unit');
    }
  }

  async removeMember(actor: AuthUser, unitId: string, memberId: string) {
    await this.assertCanManageUnit(actor, unitId);

    const result = await this.prisma.unitMember.deleteMany({
      where: { unitId, memberId, tenantId: this.tenantId },
    });
    if (result.count === 0) throw new NotFoundException('Member not in this unit');
    return { unitId, memberId, removed: true };
  }

  /**
   * Set the lead/assistant role for an existing unit member.
   * Only ADMIN+ can change roles — leads/assistants cannot self-promote peers.
   */
  async setMemberRole(actor: AuthUser, unitId: string, memberId: string, dto: SetMemberRoleDto) {
    if (!actor.role || !ADMIN_ROLES.includes(actor.role)) {
      throw new ForbiddenException('Only ADMIN+ can change unit roles');
    }

    if (dto.isLead && dto.isAssistant) {
      throw new BadRequestException('A member cannot be both lead and assistant');
    }

    const link = await this.prisma.unitMember.findFirst({
      where: { unitId, memberId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!link) throw new NotFoundException('Member not in this unit');

    return this.prisma.unitMember.update({
      where: { id: link.id },
      data: {
        ...(dto.isLead !== undefined && { isLead: dto.isLead }),
        ...(dto.isAssistant !== undefined && { isAssistant: dto.isAssistant }),
      },
    });
  }

  // ── Directory ───────────────────────────────────────────────────────────────

  /**
   * Returns all units (with lead + assistant) and all named leaders:
   * UNIT_LEAD, ADMIN, PASTOR, SUPER_ADMIN.
   */
  async getDirectory() {
    const [units, profiles] = await Promise.all([
      this.prisma.unit.findMany({
        where: { tenantId: this.tenantId },
        include: {
          UnitMember: {
            where: { OR: [{ isLead: true }, { isAssistant: true }] },
            include: {
              Member: {
                select: { id: true, firstName: true, lastName: true, email: true, phone: true, photoUrl: true },
              },
            },
          },
          _count: { select: { UnitMember: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.profile.findMany({
        where: {
          tenantId: this.tenantId,
          role: { in: [Role.UNIT_LEAD, Role.ADMIN, Role.PASTOR, Role.SUPER_ADMIN] },
        },
        include: {
          Member: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true, photoUrl: true },
          },
        },
        orderBy: { role: 'asc' },
      }),
    ]);

    return {
      units: units.map((u) => ({
        id: u.id,
        name: u.name,
        description: u.description,
        totalMembers: u._count.UnitMember,
        lead: u.UnitMember.find((m) => m.isLead)?.Member ?? null,
        assistant: u.UnitMember.find((m) => m.isAssistant)?.Member ?? null,
      })),
      leadership: profiles.map((p) => ({
        profileId: p.id,
        role: p.role,
        member: p.Member
          ? {
              id: p.Member.id,
              firstName: p.Member.firstName,
              lastName: p.Member.lastName,
              email: p.Member.email,
              phone: p.Member.phone,
              photoUrl: p.Member.photoUrl,
            }
          : null,
      })),
    };
  }

  // ── Authorization helper ────────────────────────────────────────────────────

  /**
   * Throws ForbiddenException unless:
   *   - actor is ADMIN / PASTOR / SUPER_ADMIN, OR
   *   - actor is the LEAD or ASSISTANT of THIS unit
   */
  private async assertCanManageUnit(actor: AuthUser, unitId: string) {
    if (actor.role && ADMIN_ROLES.includes(actor.role)) return;

    if (actor.role === Role.UNIT_LEAD || actor.role === Role.MEMBER) {
      if (!actor.memberId) {
        throw new ForbiddenException('No member record on your account');
      }
      const membership = await this.prisma.unitMember.findFirst({
        where: {
          unitId,
          memberId: actor.memberId,
          tenantId: this.tenantId,
          OR: [{ isLead: true }, { isAssistant: true }],
        },
        select: { id: true },
      });
      if (!membership) {
        throw new ForbiddenException('You are not a lead or assistant of this unit');
      }
      return;
    }

    throw new ForbiddenException('Insufficient role to manage units');
  }
}
