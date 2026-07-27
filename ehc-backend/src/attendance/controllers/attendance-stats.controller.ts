import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AttendanceOverviewService } from '../services/attendance-overview.service';
import { AttendanceStatsService } from '../services/attendance-stats.service';
import { AttendanceSummaryService } from '../services/attendance-summary.service';

/** ADMIN dashboard chart/stat data. */
@ApiTags('attendance')
@Controller('attendance')
@ApiBearerAuth('access-token')
export class AttendanceStatsController {
  constructor(
    private readonly overview: AttendanceOverviewService,
    private readonly stats: AttendanceStatsService,
    private readonly summary: AttendanceSummaryService,
  ) {}

  @Get('today')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get today service attendance with members (ADMIN+)' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getTodayAttendance() {
    return this.overview.getTodayAttendanceWithMembers();
  }

  @Get('stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get attendance dashboard stats (ADMIN+)' })
  async getStats() {
    const [totalServices, nextService, recentServices, todayCheckIns] = await Promise.all([
      this.overview.countTotalServices(),
      this.overview.getNextService(),
      this.stats.getRecentServicesStats(),
      this.overview.countTodayCheckIns(),
    ]);
    return { totalServices, nextService, recentServices, todayCheckIns };
  }

  @Get('trend')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get attendance trend (ADMIN+)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAttendanceTrend(@Query('limit') limit?: string) {
    return this.stats.getAttendanceTrend(limit ? Number(limit) : 16);
  }

  @Get('day-of-week')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Attendance by day of week (ADMIN+)' })
  async getAttendanceByDayOfWeek() {
    return this.stats.getAttendanceByDayOfWeek();
  }

  @Get('top-attendees')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Top attendees (ADMIN+)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopAttendees(@Query('limit') limit?: string) {
    return this.stats.getTopAttendees(limit ? Number(limit) : 10);
  }

  @Get('summary')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Attendance summary metrics (ADMIN+)' })
  async getAttendanceSummary() {
    return this.summary.getAttendanceSummary();
  }
}
