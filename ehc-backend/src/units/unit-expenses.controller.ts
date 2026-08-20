import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CreateUnitExpenseDto, UpdateUnitExpenseDto } from './dto/unit-expense.dto';
import { UnitExpensesService } from './services/unit-expenses.service';

@ApiTags('units')
@Controller('units')
@ApiBearerAuth('access-token')
export class UnitExpensesController {
  constructor(private readonly expenses: UnitExpensesService) {}

  @Get(':unitId/expenses')
  @ApiOperation({ summary: 'List expense entries for a unit (with running total)' })
  async list(@CurrentUser() actor: AuthUser, @Param('unitId') unitId: string) {
    return this.expenses.list(actor, unitId);
  }

  @Post(':unitId/expenses')
  @ApiOperation({ summary: 'Log an expense for a unit (lead/assistant of unit, or ADMIN+)' })
  @ApiBody({ type: CreateUnitExpenseDto })
  async create(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Body() body: CreateUnitExpenseDto,
  ) {
    return this.expenses.create(actor, unitId, body);
  }

  @Patch(':unitId/expenses/:expenseId')
  @ApiOperation({ summary: 'Edit an expense entry' })
  @ApiBody({ type: UpdateUnitExpenseDto })
  async update(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('expenseId') expenseId: string,
    @Body() body: UpdateUnitExpenseDto,
  ) {
    return this.expenses.update(actor, unitId, expenseId, body);
  }

  @Delete(':unitId/expenses/:expenseId')
  @ApiOperation({ summary: 'Delete an expense entry' })
  async delete(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('expenseId') expenseId: string,
  ) {
    return this.expenses.delete(actor, unitId, expenseId);
  }
}
