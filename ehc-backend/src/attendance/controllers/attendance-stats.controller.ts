import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AttendanceOverviewService } from '../services/attendance-overview.service';

/** ADMIN dashboard chart/stat data. */
@ApiTags('attendance')
@Controller('attendance')
@ApiBearerAuth('access-token')
export class AttendanceStatsController {
  constructor(
    private readonly overview: AttendanceOverviewService,
  ) {}

  @Get('today')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get today service attendance with members (ADMIN+)' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getTodayAttendance() {
    return this.overview.getTodayAttendanceWithMembers();
  }
}
