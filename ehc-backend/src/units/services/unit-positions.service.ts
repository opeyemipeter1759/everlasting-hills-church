import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import type { CreateUnitPositionDto, SetMemberPositionDto, UpdateUnitPositionDto } from '../dto/unit-position.dto';
import { UnitsMembershipService } from './units-membership.service';

/**
 * Custom named titles within a unit (e.g. "Secretary", "Treasurer") — distinct
 * from the Lead/Assistant flags on UnitMember, which are handled by
 * UnitsRoleService.
 */
@Injectable()
export class UnitPositionsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: UnitsMembershipService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async list(actor: AuthUser, unitId: string) {
    await this.membership.assertCanManageUnit(actor, unitId);
    return this.prisma.unitPosition.findMany({
      where: { unitId, tenantId: this.tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async create(actor: AuthUser, unitId: string, dto: CreateUnitPositionDto) {
    await this.membership.assertCanManageUnit(actor, unitId);
    try {
      return await this.prisma.unitPosition.create({
        data: { id: randomUUID(), tenantId: this.tenantId, unitId, name: dto.name.trim() },
      });
    } catch {
      throw new BadRequestException('A position with this name already exists in this unit');
    }
  }

  async update(actor: AuthUser, unitId: string, positionId: string, dto: UpdateUnitPositionDto) {
    await this.membership.assertCanManageUnit(actor, unitId);
    const exists = await this.prisma.unitPosition.findFirst({
      where: { id: positionId, unitId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Position not found');
    try {
      return await this.prisma.unitPosition.update({
        where: { id: positionId },
        data: { name: dto.name.trim() },
      });
    } catch {
      throw new BadRequestException('A position with this name already exists in this unit');
    }
  }

  async delete(actor: AuthUser, unitId: string, positionId: string) {
    await this.membership.assertCanManageUnit(actor, unitId);
    const result = await this.prisma.unitPosition.deleteMany({
      where: { id: positionId, unitId, tenantId: this.tenantId },
    });
    if (result.count === 0) throw new NotFoundException('Position not found');
    return { id: positionId, deleted: true };
  }

  async setMemberPosition(actor: AuthUser, unitId: string, memberId: string, dto: SetMemberPositionDto) {
    await this.membership.assertCanManageUnit(actor, unitId);

    const link = await this.prisma.unitMember.findFirst({
      where: { unitId, memberId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!link) throw new NotFoundException('Member not in this unit');

    if (dto.positionId) {
      const position = await this.prisma.unitPosition.findFirst({
        where: { id: dto.positionId, unitId, tenantId: this.tenantId },
        select: { id: true },
      });
      if (!position) throw new NotFoundException('Position not found in this unit');
    }

    return this.prisma.unitMember.update({
      where: { id: link.id },
      data: { positionId: dto.positionId ?? null },
      include: { Position: true },
    });
  }
}
