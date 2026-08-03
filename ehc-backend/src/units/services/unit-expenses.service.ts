import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import type { CreateUnitExpenseDto, UpdateUnitExpenseDto } from '../dto/unit-expense.dto';
import { UnitsMembershipService } from './units-membership.service';

/** A running expense log per unit — no approval workflow, just a record. */
@Injectable()
export class UnitExpensesService {
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
    const expenses = await this.prisma.unitExpense.findMany({
      where: { unitId, tenantId: this.tenantId },
      orderBy: { date: 'desc' },
    });
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    return { expenses, total };
  }

  async create(actor: AuthUser, unitId: string, dto: CreateUnitExpenseDto) {
    await this.membership.assertCanManageUnit(actor, unitId);
    return this.prisma.unitExpense.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        unitId,
        title: dto.title.trim(),
        amount: dto.amount,
        category: dto.category?.trim() ?? null,
        date: new Date(dto.date),
        description: dto.description?.trim() ?? null,
        receiptUrl: dto.receiptUrl ?? null,
        createdById: actor.profileId!,
      },
    });
  }

  async update(actor: AuthUser, unitId: string, expenseId: string, dto: UpdateUnitExpenseDto) {
    await this.membership.assertCanManageUnit(actor, unitId);
    const exists = await this.prisma.unitExpense.findFirst({
      where: { id: expenseId, unitId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Expense not found');

    return this.prisma.unitExpense.update({
      where: { id: expenseId },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.category !== undefined && { category: dto.category?.trim() ?? null }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.description !== undefined && { description: dto.description?.trim() ?? null }),
        ...(dto.receiptUrl !== undefined && { receiptUrl: dto.receiptUrl }),
      },
    });
  }

  async delete(actor: AuthUser, unitId: string, expenseId: string) {
    await this.membership.assertCanManageUnit(actor, unitId);
    const result = await this.prisma.unitExpense.deleteMany({
      where: { id: expenseId, unitId, tenantId: this.tenantId },
    });
    if (result.count === 0) throw new NotFoundException('Expense not found');
    return { id: expenseId, deleted: true };
  }
}
