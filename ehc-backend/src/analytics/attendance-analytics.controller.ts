import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceOverviewService } from './attendance-overview.service';
import { AttendanceComparisonService } from './attendance-comparison.service';
import { AttendanceInsightsService } from './attendance-insights.service';
import { AttendanceAlertsService } from './attendance-alerts.service';
import type { Period, QueryFilter } from './attendance-analytics.utils';

@ApiTags('analytics')
@Controller('analytics')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class AttendanceAnalyticsController {
  constructor(
    private readonly overview: AttendanceOverviewService,
    private readonly comparison: AttendanceComparisonService,
    private readonly insights: AttendanceInsightsService,
    private readonly alerts: AttendanceAlertsService,
  ) {}

  private filter(period?: Period, dateFrom?: string, dateTo?: string, serviceType?: string): QueryFilter {
    return { period, dateFrom, dateTo, serviceType };
  }

  @Get('overview')
  @ApiOperation({ summary: 'Stat cards — supports period OR dateFrom+dateTo+serviceType' })
  getOverview(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.overview.getOverview(this.filter(p, df, dt, st));
  }

  @Get('trend')
  @ApiOperation({ summary: 'Per-service attendance trend' })
  getTrend(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.overview.getTrend(this.filter(p, df, dt, st));
  }

  @Get('split')
  @ApiOperation({ summary: 'Present vs absent totals (donut)' })
  getSplit(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.overview.getSplit(this.filter(p, df, dt, st));
  }

  @Get('rate-trend')
  @ApiOperation({ summary: 'Attendance rate over time' })
  getRateTrend(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.overview.getRateTrend(this.filter(p, df, dt, st));
  }

  @Get('absentee-trend')
  @ApiOperation({ summary: 'Absentee count trend' })
  getAbsenteeTrend(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.overview.getAbsenteeTrend(this.filter(p, df, dt, st));
  }

  @Get('service-comparison')
  @ApiOperation({ summary: 'Sunday vs Wednesday comparison' })
  getServiceComparison(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string) {
    return this.comparison.getServiceComparison(this.filter(p, df, dt));
  }

  @Get('member-growth')
  @ApiOperation({ summary: 'New member growth over time' })
  getMemberGrowth(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string) {
    return this.comparison.getMemberGrowth(this.filter(p, df, dt));
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Top attendees ranked by rate' })
  getLeaderboard(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string, @Query('limit') limit?: string) {
    return this.comparison.getLeaderboard(this.filter(p, df, dt, st), limit ? Number(limit) : 10);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare two date ranges — period or dateFrom+dateTo per side' })
  getCompare(
    @Query('periodA') pA?: string, @Query('dateFromA') dfA?: string, @Query('dateToA') dtA?: string,
    @Query('periodB') pB?: string, @Query('dateFromB') dfB?: string, @Query('dateToB') dtB?: string,
  ) {
    return this.comparison.getComparePeriods({ period: pA, dateFrom: dfA, dateTo: dtA }, { period: pB, dateFrom: dfB, dateTo: dtB });
  }

  @Get('first-timers')
  @ApiOperation({ summary: 'Members attending for the first time in the period' })
  getFirstTimers(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.insights.getFirstTimers(this.filter(p, df, dt, st));
  }

  @Get('retention')
  @ApiOperation({ summary: 'Member retention vs previous period' })
  getRetention(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.insights.getRetention(this.filter(p, df, dt, st));
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Full-year attendance heatmap' })
  getHeatmap(@Query('year') year?: string, @Query('serviceType') st?: string) {
    return this.insights.getHeatmap(year ? Number(year) : new Date().getFullYear(), st);
  }

  @Get('peak-hours')
  @ApiOperation({ summary: 'Peak check-in hours' })
  getPeakHours(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.insights.getPeakHours(this.filter(p, df, dt, st));
  }

  @Get('consistency')
  @ApiOperation({ summary: 'Member consistency scores and streaks' })
  getConsistency(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string, @Query('limit') limit?: string) {
    return this.alerts.getConsistency(this.filter(p, df, dt, st), limit ? Number(limit) : 10);
  }

  @Get('service-health')
  @ApiOperation({ summary: 'Health scores per service type' })
  getServiceHealth() { return this.alerts.getServiceHealth(); }

  @Get('alerts')
  @ApiOperation({ summary: 'At-risk, low-turnout, and milestone alerts' })
  getAlerts() { return this.alerts.getAlerts(); }
}
