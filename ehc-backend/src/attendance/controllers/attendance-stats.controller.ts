import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AttendanceOverviewService } from '../services/attendance-overview.service';
import { AttendanceServiceOverviewService } from '../services/attendance-service-overview.service';

/** ADMIN dashboard chart/stat data. */
@ApiTags('attendance')
@Controller('attendance')
@ApiBearerAuth('access-token')
export class AttendanceStatsController {
  constructor(
    private readonly overview: AttendanceOverviewService,
    private readonly serviceOverview: AttendanceServiceOverviewService,
  ) {}

  @Get('today')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get today service attendance with members (ADMIN+)' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getTodayAttendance() {
    return this.overview.getTodayAttendanceWithMembers();
  }

  @Get('service-overview')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Recent services with the ushers headcount and member check-ins, newest first (ADMIN+)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'How many services, 1-52 (default 12)' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  getServiceOverview(@Query('limit') limit?: string) {
    return this.serviceOverview.recentServices(limit ? Number(limit) : undefined);
  }
}
