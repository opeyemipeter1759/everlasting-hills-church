import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { DepartmentsMineService } from './services/departments-mine.service';
import { DepartmentsEngagementService } from './services/departments-engagement.service';
import { DepartmentsUnitsService } from './services/departments-units.service';

/**
 * Admin Head / HOD scoped surface. Registered BEFORE DepartmentsController (which
 * owns the GET /:id catch-all) so "mine" is never captured as a department id.
 */
@ApiTags('departments')
@Controller('departments')
@ApiBearerAuth('access-token')
export class DepartmentsMineController {
  constructor(
    private readonly mine: DepartmentsMineService,
    private readonly engagement: DepartmentsEngagementService,
    private readonly units: DepartmentsUnitsService,
  ) {}

  @Get('mine')
  @Roles(Role.HOD)
  @ApiOperation({ summary: 'Departments the current Admin Head/HOD oversees, with units + counts (HOD+)' })
  getMine(@CurrentUser() user: AuthUser) {
    return this.mine.getMine(user);
  }

  @Get('mine/units/:unitId/roster')
  @Roles(Role.HOD)
  @ApiOperation({ summary: 'Roster of a unit within the actor\'s department (403 outside scope) (HOD+)' })
  getMyUnitRoster(@CurrentUser() user: AuthUser, @Param('unitId') unitId: string) {
    return this.mine.getMyUnitRoster(user, unitId);
  }

  @Post('mine/announcements')
  @Roles(Role.HOD)
  @ApiOperation({ summary: 'Post an announcement scoped to a department the actor leads (HOD+)' })
  postMyAnnouncement(@CurrentUser() user: AuthUser, @Body() body: { departmentId?: string; title?: string; body?: string }) {
    if (!body?.departmentId) throw new BadRequestException('departmentId is required');
    return this.engagement.postDeptAnnouncement(user, body.departmentId, body);
  }

  @Post('mine/units/:unitId/nudge')
  @Roles(Role.HOD)
  @ApiOperation({ summary: 'Nudge a unit lead within the actor\'s department (HOD+)' })
  nudge(@CurrentUser() user: AuthUser, @Param('unitId') unitId: string, @Body() body: unknown) {
    return this.engagement.nudgeLead(user, unitId, body);
  }

  @Post('mine/units')
  @Roles(Role.HOD)
  @ApiOperation({ summary: 'Create a new unit under a department the actor heads (HOD+)' })
  createMyUnit(@CurrentUser() user: AuthUser, @Body() body: { departmentId?: string; name?: string; description?: string }) {
    if (!body?.departmentId) throw new BadRequestException('departmentId is required');
    return this.units.createUnit(user, body.departmentId, body);
  }
}
