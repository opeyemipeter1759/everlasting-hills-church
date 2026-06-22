import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceAnalyticsService } from './attendance-analytics.service';
import { AttendanceAnalyticsBService } from './attendance-analytics-b.service';
import { AttendanceAnalyticsCService } from './attendance-analytics-c.service';
import type { Period, QueryFilter } from './attendance-analytics.utils';

@ApiTags('analytics')
@Controller('analytics')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class AttendanceAnalyticsController {
  constructor(
    private readonly svcA: AttendanceAnalyticsService,
    private readonly svcB: AttendanceAnalyticsBService,
    private readonly svcC: AttendanceAnalyticsCService,
  ) {}

  private filter(period?: Period, dateFrom?: string, dateTo?: string, serviceType?: string): QueryFilter {
    return { period, dateFrom, dateTo, serviceType };
  }

  @Get('overview')
  @ApiOperation({ summary: 'Stat cards — supports period OR dateFrom+dateTo+serviceType' })
  getOverview(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.svcA.getOverview(this.filter(p, df, dt, st));
  }

  @Get('trend')
  @ApiOperation({ summary: 'Per-service attendance trend' })
  getTrend(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.svcA.getTrend(this.filter(p, df, dt, st));
  }

  @Get('split')
  @ApiOperation({ summary: 'Present vs absent totals (donut)' })
  getSplit(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.svcA.getSplit(this.filter(p, df, dt, st));
  }

  @Get('rate-trend')
  @ApiOperation({ summary: 'Attendance rate over time' })
  getRateTrend(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.svcA.getRateTrend(this.filter(p, df, dt, st));
  }

  @Get('absentee-trend')
  @ApiOperation({ summary: 'Absentee count trend' })
  getAbsenteeTrend(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.svcA.getAbsenteeTrend(this.filter(p, df, dt, st));
  }

  @Get('service-comparison')
  @ApiOperation({ summary: 'Sunday vs Wednesday comparison' })
  getServiceComparison(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string) {
    return this.svcB.getServiceComparison(this.filter(p, df, dt));
  }

  @Get('member-growth')
  @ApiOperation({ summary: 'New member growth over time' })
  getMemberGrowth(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string) {
    return this.svcB.getMemberGrowth(this.filter(p, df, dt));
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Top attendees ranked by rate' })
  getLeaderboard(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string, @Query('limit') limit?: string) {
    return this.svcB.getLeaderboard(this.filter(p, df, dt, st), limit ? Number(limit) : 10);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare two date ranges — period or dateFrom+dateTo per side' })
  getCompare(
    @Query('periodA') pA?: string, @Query('dateFromA') dfA?: string, @Query('dateToA') dtA?: string,
    @Query('periodB') pB?: string, @Query('dateFromB') dfB?: string, @Query('dateToB') dtB?: string,
  ) {
    return this.svcB.getComparePeriods({ period: pA, dateFrom: dfA, dateTo: dtA }, { period: pB, dateFrom: dfB, dateTo: dtB });
  }

  @Get('first-timers')
  @ApiOperation({ summary: 'Members attending for the first time in the period' })
  getFirstTimers(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.svcC.getFirstTimers(this.filter(p, df, dt, st));
  }

  @Get('retention')
  @ApiOperation({ summary: 'Member retention vs previous period' })
  getRetention(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.svcC.getRetention(this.filter(p, df, dt, st));
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Full-year attendance heatmap' })
  getHeatmap(@Query('year') year?: string, @Query('serviceType') st?: string) {
    return this.svcC.getHeatmap(year ? Number(year) : new Date().getFullYear(), st);
  }

  @Get('peak-hours')
  @ApiOperation({ summary: 'Peak check-in hours' })
  getPeakHours(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.svcC.getPeakHours(this.filter(p, df, dt, st));
  }

  @Get('consistency')
  @ApiOperation({ summary: 'Member consistency scores and streaks' })
  getConsistency(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string, @Query('limit') limit?: string) {
    return this.svcC.getConsistency(this.filter(p, df, dt, st), limit ? Number(limit) : 10);
  }

  @Get('service-health')
  @ApiOperation({ summary: 'Health scores per service type' })
  getServiceHealth() { return this.svcC.getServiceHealth(); }

  @Get('alerts')
  @ApiOperation({ summary: 'At-risk, low-turnout, and milestone alerts' })
  getAlerts() { return this.svcC.getAlerts(); }
}
