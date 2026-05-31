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
import type { AssignUnitMemberDto, CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';

/**
 * Units module.
 *
 * Three audiences:
 *   - any signed-in user → /units/me (their lead-assignment)
 *   - ADMIN+             → full CRUD on units
 *   - UNIT_LEAD          → can assign/remove members ONLY for units they lead
 */
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

  async findUnitLedBy(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { Member: { select: { id: true } } },
    });
    if (!profile?.Member) return null;

    const lead = await this.prisma.unitMember.findFirst({
      where: { memberId: profile.Member.id, isLead: true },
      include: {
        Unit: { include: { _count: { select: { UnitMember: true } } } },
      },
    });
    if (!lead) return null;

    return {
      id: lead.Unit.id,
      name: lead.Unit.name,
      description: lead.Unit.description,
      totalMembers: lead.Unit._count.UnitMember,
      isLead: true,
    };
  }

  // ── Admin CRUD ──────────────────────────────────────────────────────────────

  async listAll() {
    return this.prisma.unit.findMany({
      where: { tenantId: this.tenantId },
      include: { _count: { select: { UnitMember: true } } },
      orderBy: { createdAt: 'desc' },
    });
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
        },
      },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
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

  /**
   * Add a member to a unit. ADMIN+ can do this for any unit. UNIT_LEAD can only
   * do it for the unit they lead.
   */
  async addMember(actor: AuthUser, unitId: string, data: AssignUnitMemberDto) {
    await this.assertCanManageUnit(actor, unitId);

    const member = await this.prisma.member.findFirst({
      where: { id: data.memberId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    try {
      return await this.prisma.unitMember.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          unitId,
          memberId: data.memberId,
          isLead: data.isLead ?? false,
        },
      });
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
   * Promote/demote a unit member to/from lead status.
   * Only ADMIN+ — UNIT_LEADs can't crown peers.
   */
  async setMemberLead(actor: AuthUser, unitId: string, memberId: string, isLead: boolean) {
    if (
      !actor.role ||
      (actor.role !== Role.ADMIN &&
        actor.role !== Role.PASTOR &&
        actor.role !== Role.SUPER_ADMIN)
    ) {
      throw new ForbiddenException('Only ADMIN+ can change unit lead');
    }
    const link = await this.prisma.unitMember.findFirst({
      where: { unitId, memberId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!link) throw new NotFoundException('Member not in this unit');

    return this.prisma.unitMember.update({
      where: { id: link.id },
      data: { isLead },
    });
  }

  // ── Authorization helper ────────────────────────────────────────────────────

  /**
   * Throws ForbiddenException unless the actor is ADMIN+ OR is the lead of THIS unit.
   */
  private async assertCanManageUnit(actor: AuthUser, unitId: string) {
    if (
      actor.role === Role.ADMIN ||
      actor.role === Role.PASTOR ||
      actor.role === Role.SUPER_ADMIN
    ) {
      return;
    }

    if (actor.role === Role.UNIT_LEAD) {
      if (!actor.memberId) {
        throw new ForbiddenException('No member record on your account');
      }
      const lead = await this.prisma.unitMember.findFirst({
        where: { unitId, memberId: actor.memberId, isLead: true, tenantId: this.tenantId },
        select: { id: true },
      });
      if (!lead) {
        throw new ForbiddenException('You do not lead this unit');
      }
      return;
    }

    throw new ForbiddenException('Insufficient role to manage units');
  }
}
