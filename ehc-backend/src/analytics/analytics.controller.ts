import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('admin')
@Controller('admin')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Get admin analytics' })
  @ApiOkResponse({
    description: 'Admin analytics payload',
    schema: {
      example: {
        totalMembers: 123,
        totalVisitors: 45,
        totalPrayers: 10,
        totalGivingNaira: 250000,
        avgAttendance: 80,
        newMembersThisMonth: 5,
      },
    },
  })
  async getAnalytics() {
    return this.analyticsService.getAdminAnalytics();
  }

  @Get('units')
  @ApiOperation({ summary: 'Get department/unit stats' })
  async getUnits(@Query('unitId') unitId?: string) {
    return this.analyticsService.getDepartmentStats(unitId);
  }

  @Get('units/:unitId/attendance')
  @ApiOperation({ summary: 'Get unit member attendance' })
  async getUnitAttendance(@Param('unitId') unitId: string, @Query('months') months?: string) {
    return this.analyticsService.getUnitMemberAttendance(unitId, months ? Number(months) : 3);
  }

  @Get('first-timer/pipeline')
  @ApiOperation({ summary: 'Get first-timer pipeline stats' })
  async getFirstTimerPipeline() {
    return this.analyticsService.getFirstTimerPipeline();
  }

  @Get('first-timer/sources')
  @ApiOperation({ summary: 'Get first-timer sources' })
  async getFirstTimerSources() {
    return this.analyticsService.getFirstTimerSources();
  }

  @Get('first-timers-by-month')
  @ApiOperation({ summary: 'Get first-timers by month' })
  async getFirstTimersByMonth(@Query('months') months?: string) {
    return this.analyticsService.getFirstTimersByMonth(months ? Number(months) : 6);
  }

  // ── Giving (PASTOR+) ────────────────────────────────────────────────────────
  @Get('giving/trend')
  @Roles(Role.PASTOR)
  @ApiOperation({ summary: 'Giving trend (PASTOR+)' })
  async getGivingTrend(@Query('months') months?: string) {
    return this.analyticsService.getGivingTrend(months ? Number(months) : 6);
  }

  @Get('giving/categories')
  @Roles(Role.PASTOR)
  @ApiOperation({ summary: 'Giving by category (PASTOR+)' })
  async getGivingByCategory() {
    return this.analyticsService.getGivingByCategory();
  }

  @Get('giving/summary')
  @Roles(Role.PASTOR)
  @ApiOperation({ summary: 'Giving summary (PASTOR+)' })
  async getGivingSummary() {
    return this.analyticsService.getGivingSummary();
  }

  @Get('giving/top-donors')
  @Roles(Role.PASTOR)
  @ApiOperation({ summary: 'Top donors (PASTOR+)' })
  async getTopDonors(@Query('limit') limit?: string) {
    return this.analyticsService.getTopDonors(limit ? Number(limit) : 10);
  }

  // ── Engagement (PASTOR+) ────────────────────────────────────────────────────
  @Post('engagement/refresh')
  @Roles(Role.PASTOR)
  @ApiOperation({ summary: 'Refresh engagement scores (PASTOR+)' })
  async refreshEngagement() {
    return this.analyticsService.refreshEngagementScores();
  }

  @Get('engagement/leaderboard')
  @Roles(Role.PASTOR)
  @ApiOperation({ summary: 'Engagement leaderboard (PASTOR+)' })
  async engagementLeaderboard(@Query('limit') limit?: string) {
    return this.analyticsService.getEngagementLeaderboard(limit ? Number(limit) : 25);
  }

  @Get('engagement/at-risk')
  @Roles(Role.PASTOR)
  @ApiOperation({ summary: 'Members at risk (PASTOR+)' })
  async engagementAtRisk() {
    return this.analyticsService.getAtRiskMembers();
  }

  @Get('engagement/distribution')
  @Roles(Role.PASTOR)
  @ApiOperation({ summary: 'Engagement distribution (PASTOR+)' })
  async engagementDistribution() {
    return this.analyticsService.getEngagementDistribution();
  }

  @Get('engagement/summary')
  @Roles(Role.PASTOR)
  @ApiOperation({ summary: 'Engagement summary (PASTOR+)' })
  async engagementSummary() {
    return this.analyticsService.getEngagementSummary();
  }
}
