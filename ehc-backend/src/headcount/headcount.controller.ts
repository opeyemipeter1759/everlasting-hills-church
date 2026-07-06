import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role, ServiceType } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { HeadcountService } from './headcount.service';

/**
 * Usher headcount: the authoritative aggregate count per service. All routes are
 * gated to HEAD_USHER, which (by the role hierarchy) also admits ADMIN, PASTOR,
 * and SUPER_ADMIN. MEMBER / UNIT_LEAD / VISITOR have no access.
 *
 * Thin controller: validation, computed total, variance, and the service-state
 * gate all live in HeadcountService.
 */
@ApiTags('headcount')
@Controller('headcount')
@ApiBearerAuth('access-token')
@Roles(Role.HEAD_USHER)
export class HeadcountController {
  constructor(private readonly headcount: HeadcountService) {}

  @Get('by-date')
  @ApiOperation({ summary: 'Service + headcount for a chosen calendar date (HEAD_USHER+)' })
  @ApiQuery({ name: 'date', required: true, example: '2026-07-04' })
  getForDate(@Query('date') date: string) {
    return this.headcount.getForDate(date);
  }

  @Put('by-date')
  @ApiOperation({ summary: 'Record the headcount for a chosen date; finds or creates that day\'s service (HEAD_USHER+)' })
  @ApiQuery({ name: 'date', required: true, example: '2026-07-04' })
  upsertByDate(
    @CurrentUser() user: AuthUser,
    @Query('date') date: string,
    @Body() body: unknown,
  ) {
    return this.headcount.upsertByDate(date, body, { id: user.userId });
  }

  @Get('service/:serviceId')
  @ApiOperation({ summary: 'Headcount for a service + whether it can be recorded now (HEAD_USHER+)' })
  getForService(@Param('serviceId') serviceId: string) {
    return this.headcount.getForService(serviceId);
  }

  @Put('service/:serviceId')
  @ApiOperation({ summary: 'Create or update the authoritative headcount for a service (HEAD_USHER+)' })
  upsert(
    @CurrentUser() user: AuthUser,
    @Param('serviceId') serviceId: string,
    @Body() body: unknown,
  ) {
    return this.headcount.upsert(serviceId, body, { id: user.userId });
  }

  @Get('history')
  @ApiOperation({ summary: 'Recent headcounts across services, newest first (HEAD_USHER+)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(@Query('limit') limit?: string) {
    return this.headcount.getHistory(limit ? Number(limit) : 30);
  }

  @Get('today')
  @ApiOperation({ summary: "Today's congregation headcount total (HEAD_USHER+)" })
  getToday() {
    return this.headcount.getTodayHeadcount();
  }

  @Get('trend')
  @ApiOperation({ summary: 'Headcount attendance trend + category breakdown, tagged by service type (HEAD_USHER+)' })
  @ApiQuery({ name: 'serviceType', required: false, enum: ServiceType })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTrend(
    @Query('serviceType') serviceType?: ServiceType,
    @Query('limit') limit?: string,
  ) {
    return this.headcount.getTrend({
      serviceType: serviceType && serviceType in ServiceType ? serviceType : undefined,
      limit: limit ? Number(limit) : 24,
    });
  }
}
