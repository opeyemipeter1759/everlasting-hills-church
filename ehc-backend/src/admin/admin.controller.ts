import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
@ApiBearerAuth('access-token')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats/overview')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Operational stat cards for the admin dashboard (ADMIN+)' })
  @ApiOkResponse({
    schema: {
      example: {
        totalMembers: 120,
        activeThisMonth: 98,
        inactiveThisMonth: 22,
        todayPresent: 34,
      },
    },
  })
  getStatsOverview() {
    return this.adminService.getStatsOverview();
  }

  @Get('dashboard-summary')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Live stat cards (members, attendance, visitors, volunteers, events, sermons) with MoM trends (ADMIN+)' })
  @ApiOkResponse({
    schema: {
      example: {
        stats: [
          { key: 'members', label: 'Members', value: 1284, trend: { value: 4.2, direction: 'up' } },
        ],
      },
    },
  })
  getDashboardSummary() {
    return this.adminService.getDashboardSummary();
  }

  @Get('attendance-trend')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Attendance trend points tagged by service type for Sunday/Wednesday filtering (ADMIN+)' })
  @ApiOkResponse({
    schema: {
      example: {
        points: [
          { label: '7 Apr', value: 420, serviceType: 'SUNDAY', date: '2026-04-07T09:00:00.000Z' },
        ],
      },
    },
  })
  getAttendanceTrend() {
    return this.adminService.getAttendanceTrend();
  }
}
