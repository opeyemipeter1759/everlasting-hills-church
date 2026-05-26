import { Controller, Get, Req, Query, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AuthService } from '../auth/auth.service';

@ApiTags('admin')
@Controller('admin')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService, private readonly authService: AuthService) {}

  @Get('analytics')
  @ApiBearerAuth('access-token')
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
        memberGrowth: [
          { label: 'Dec', value: 2 },
          { label: 'Jan', value: 3 },
          { label: 'Feb', value: 4 },
          { label: 'Mar', value: 5 },
          { label: 'Apr', value: 6 },
          { label: 'May', value: 7 }
        ],
        attendanceTrend: [
          { label: '12 May', value: 72 },
          { label: '19 May', value: 75 },
          { label: '26 May', value: 80 }
        ],
        visitorSources: [ { label: 'Facebook', value: 12 }, { label: 'Friend', value: 8 } ],
        prayersByMonth: [ { label: 'Dec', value: 1 }, { label: 'Jan', value: 2 } ],
        inPerson: 30,
        online: 15,
        unspecified: 0,
        interested: 5,
        notInterested: 40,
        memberTrend: 20,
        newMembersThisMonth: 5,
        newMembersLastMonth: 3,
        newMembersThisYear: 20,
        newMembersLastYear: 15,
        visitorsToday: 1,
        visitorsYesterday: 2,
        visitorsThisMonth: 10,
        visitorsLastMonth: 8,
        visitorsThisYear: 50,
        visitorsLastYear: 60
      }
    }
  })
  async getAnalytics(@Req() request: { headers?: { authorization?: string } }) {
    // validate token
    await this.authService.getProfile(request.headers?.authorization);
    return this.analyticsService.getAdminAnalytics();
  }

  @Get('units')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get department/unit stats' })
  @ApiOkResponse({
    description: 'List of unit/department stats',
    schema: {
      example: [
        {
          id: 'unit-1',
          name: 'Hospitality',
          totalMembers: 25,
          activeMembers: 20,
          recentAttendees: 15,
          attendanceRate: 75,
          leadName: 'John Doe'
        }
      ]
    }
  })
  async getUnits(@Req() request: { headers?: { authorization?: string } }, @Query('unitId') unitId?: string) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.analyticsService.getDepartmentStats(unitId);
  }

  @Get('units/:unitId/attendance')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get unit member attendance' })
  @ApiOkResponse({
    description: 'Member attendance list for a unit',
    schema: {
      example: [
        {
          memberId: 'member-1',
          name: 'Jane Smith',
          photoUrl: 'https://example.com/avatar.jpg',
          isLead: false,
          status: 'ACTIVE',
          attended: 5,
          total: 6,
          rate: 83
        }
      ]
    }
  })
  async getUnitAttendance(@Req() request: { headers?: { authorization?: string } }, @Param('unitId') unitId?: string, @Query('months') months?: string) {
    await this.authService.getProfile(request.headers?.authorization);
    const m = months ? Number(months) : 3;
    return this.analyticsService.getUnitMemberAttendance(unitId ?? '', m);
  }

  @Get('first-timer/pipeline')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get first-timer pipeline stats' })
  @ApiOkResponse({
    description: 'First-timer pipeline metrics',
    schema: {
      example: {
        total: 120,
        interestedCount: 30,
        convertedCount: 8,
        notInterestedCount: 70,
        undecidedCount: 20,
        onlineCount: 40,
        inPersonCount: 80,
        conversionRate: 27,
        interestRate: 25
      }
    }
  })
  async getFirstTimerPipeline(@Req() request: { headers?: { authorization?: string } }) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.analyticsService.getFirstTimerPipeline();
  }

  @Get('first-timer/sources')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get first-timer sources' })
  @ApiOkResponse({
    description: 'Top first-timer sources',
    schema: { example: [ { label: 'Friend', value: 20 }, { label: 'Facebook', value: 15 } ] }
  })
  async getFirstTimerSources(@Req() request: { headers?: { authorization?: string } }) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.analyticsService.getFirstTimerSources();
  }

  @Get('first-timers-by-month')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get first-timers by month' })
  @ApiOkResponse({
    description: 'First-timer counts per month',
    schema: { example: [ { label: 'Dec 25', count: 5 }, { label: 'Jan 26', count: 8 } ] }
  })
  async getFirstTimersByMonth(@Req() request: { headers?: { authorization?: string } }, @Query('months') months?: string) {
    await this.authService.getProfile(request.headers?.authorization);
    const m = months ? Number(months) : 6;
    return this.analyticsService.getFirstTimersByMonth(m);
  }

  @Get('giving/trend')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get giving trend for last N months' })
  @ApiOkResponse({ description: 'Giving trend', schema: { example: [ { label: 'Dec 25', amountNaira: 12000, count: 4 } ] } })
  async getGivingTrend(@Req() request: { headers?: { authorization?: string } }, @Query('months') months?: string) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.analyticsService.getGivingTrend(months ? Number(months) : 6);
  }

  @Get('giving/categories')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Giving by category' })
  @ApiOkResponse({ description: 'Totals grouped by category', schema: { example: [ { category: 'General', amountNaira: 120000, count: 42 } ] } })
  async getGivingByCategory(@Req() request: { headers?: { authorization?: string } }) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.analyticsService.getGivingByCategory();
  }

  @Get('giving/summary')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Giving summary' })
  @ApiOkResponse({ description: 'Giving summary metrics', schema: { example: { totalNaira: 120000, thisMonthNaira: 10000, lastMonthNaira: 8000, thisYearNaira: 90000, totalCount: 120, momChange: 25, uniqueDonors: 40, anonymous: 10, anonymousPct: 8 } } })
  async getGivingSummary(@Req() request: { headers?: { authorization?: string } }) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.analyticsService.getGivingSummary();
  }

  @Get('giving/top-donors')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Top donors' })
  @ApiOkResponse({ description: 'Top donors list', schema: { example: [ { name: 'John Doe', email: 'john@example.com', amountNaira: 100000, count: 5 } ] } })
  async getTopDonors(@Req() request: { headers?: { authorization?: string } }, @Query('limit') limit?: string) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.analyticsService.getTopDonors(limit ? Number(limit) : 10);
  }

  @Post('engagement/refresh')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Refresh engagement scores for all members' })
  @ApiOkResponse({ description: 'List of updated scores', schema: { example: [ { memberId: 'member-1', score: 78, attendanceScore: 30, sermonScore: 20, givingScore: 18, communityScore: 10 } ] } })
  async refreshEngagement(@Req() request: { headers?: { authorization?: string } }) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.analyticsService.refreshEngagementScores();
  }

  @Get('engagement/leaderboard')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Engagement leaderboard' })
  @ApiOkResponse({ description: 'Top engaged members', schema: { example: [ { memberId: 'member-1', name: 'Jane Doe', photoUrl: null, score: 90 } ] } })
  async engagementLeaderboard(@Req() request: { headers?: { authorization?: string } }, @Query('limit') limit?: string) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.analyticsService.getEngagementLeaderboard(limit ? Number(limit) : 25);
  }

  @Get('engagement/at-risk')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Members at risk (low engagement)' })
  @ApiOkResponse({ description: 'At risk members', schema: { example: [ { memberId: 'member-2', name: 'John Doe', score: 18 } ] } })
  async engagementAtRisk(@Req() request: { headers?: { authorization?: string } }) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.analyticsService.getAtRiskMembers();
  }

  @Get('engagement/distribution')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Engagement distribution buckets' })
  @ApiOkResponse({ description: 'Distribution', schema: { example: [ { label: 'Highly Engaged', range: '70–100', value: 10 } ] } })
  async engagementDistribution(@Req() request: { headers?: { authorization?: string } }) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.analyticsService.getEngagementDistribution();
  }

  @Get('engagement/summary')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Engagement summary metrics' })
  @ApiOkResponse({ description: 'Summary', schema: { example: { totalMembers: 200, scoredMembers: 150, avgScore: 62, unscored: 50 } } })
  async engagementSummary(@Req() request: { headers?: { authorization?: string } }) {
    await this.authService.getProfile(request.headers?.authorization);
    return this.analyticsService.getEngagementSummary();
  }
}
