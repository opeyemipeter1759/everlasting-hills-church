import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FinanceEntryKind } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { FinanceRolesGuard } from './finance-roles.guard';
import { FinanceService } from './finance.service';
import { UpsertServiceOfferingDto } from './dto/service-offering.dto';
import { CreateFinanceEntryDto, UpdateFinanceEntryDto } from './dto/finance-entry.dto';

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Internal finance ledger — tithe/offering per service, plus building/program/
 * rent/giving income and expenses, with weekly and monthly rollups. Gated by
 * FinanceRolesGuard, not the usual role hierarchy — see that guard for why.
 */
@ApiTags('finance')
@ApiBearerAuth('access-token')
@Controller('finance')
@UseGuards(FinanceRolesGuard)
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Post('service-offerings/:serviceId')
  @ApiOperation({ summary: 'Record (or update) tithe & offering for a service' })
  upsertServiceOffering(
    @Param('serviceId') serviceId: string,
    @Body() body: UpsertServiceOfferingDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.finance.upsertServiceOffering(serviceId, body, actor.profileId ?? null);
  }

  @Delete('service-offerings/:serviceId')
  @ApiOperation({ summary: "Clear a service's recorded tithe & offering" })
  deleteServiceOffering(@Param('serviceId') serviceId: string) {
    return this.finance.deleteServiceOffering(serviceId);
  }

  @Get('services')
  @ApiOperation({ summary: 'Services in range, with their recorded offering if any' })
  listServices(@Query('from') from?: string, @Query('to') to?: string) {
    return this.finance.listServicesWithOfferings({ from: parseDate(from), to: parseDate(to) });
  }

  @Post('entries')
  @ApiOperation({ summary: 'Record an income or expense entry' })
  createEntry(@Body() body: CreateFinanceEntryDto, @CurrentUser() actor: AuthUser) {
    return this.finance.createEntry(body, actor.profileId ?? null);
  }

  @Get('entries')
  @ApiOperation({ summary: 'List income/expense entries, newest first' })
  listEntries(@Query('from') from?: string, @Query('to') to?: string, @Query('kind') kind?: FinanceEntryKind) {
    return this.finance.listEntries({ from: parseDate(from), to: parseDate(to), kind });
  }

  @Patch('entries/:id')
  @ApiOperation({ summary: 'Edit an income/expense entry' })
  updateEntry(@Param('id') id: string, @Body() body: UpdateFinanceEntryDto) {
    return this.finance.updateEntry(id, body);
  }

  @Delete('entries/:id')
  @ApiOperation({ summary: 'Delete an income/expense entry' })
  deleteEntry(@Param('id') id: string) {
    return this.finance.deleteEntry(id);
  }

  @Get('summary/daily')
  @ApiOperation({ summary: 'Totals for a single day' })
  dailySummary(@Query('date') date: string) {
    return this.finance.getDailySummary(date);
  }

  @Get('summary/weekly')
  @ApiOperation({ summary: 'Weekly totals (Sunday-Saturday) for a given date' })
  weeklySummary(@Query('date') date: string) {
    return this.finance.getWeeklySummary(date);
  }

  @Get('summary/monthly')
  @ApiOperation({ summary: 'Monthly totals for a given year/month' })
  monthlySummary(@Query('year') year: string, @Query('month') month: string) {
    return this.finance.getMonthlySummary(Number(year), Number(month));
  }
}
