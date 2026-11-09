import { Controller, Get, Header } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { AdminHomeService } from './admin-home.service';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
@ApiBearerAuth('access-token')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminHome: AdminHomeService,
  ) {}

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

  @Get('home')
  @Roles(Role.ADMIN)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: "Everything on the admin dashboard's overview, in one request (ADMIN+; giving and recent activity are null below PASTOR)",
  })
  load(@CurrentUser() actor: AuthUser) {
    return this.adminHome.load(actor);
  }
}
