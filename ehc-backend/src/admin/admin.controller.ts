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
}
