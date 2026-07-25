import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { CreateUnitDto, UpdateUnitDto } from '../dto/unit.dto';

@Injectable()
export class UnitsCrudService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

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
}
