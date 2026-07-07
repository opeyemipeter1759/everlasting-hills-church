import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { DepartmentsService } from './departments.service';

/**
 * Administrative departments + the Admin Head surface.
 *
 * Management routes are @Roles(ADMIN): admits ADMIN/PASTOR/SUPER_ADMIN but NOT
 * ADMIN_HEAD (level 4 < ADMIN level 5), so heads cannot manage departments.
 * The /mine routes are @Roles(ADMIN_HEAD); their scope is resolved per request
 * from active DepartmentHead rows in the service layer.
 *
 * Literal /mine routes are declared before :id routes so "mine" is never captured
 * as a department id.
 */
@ApiTags('departments')
@Controller('departments')
@ApiBearerAuth('access-token')
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  // ── Admin Head: scoped surface (declared first) ──────────────────────────────

  @Get('mine')
  @Roles(Role.ADMIN_HEAD)
  @ApiOperation({ summary: 'Departments the current Admin Head oversees, with units + counts (ADMIN_HEAD+)' })
  getMine(@CurrentUser() user: AuthUser) {
    return this.departments.getMine(user);
  }

  @Get('mine/units/:unitId/roster')
  @Roles(Role.ADMIN_HEAD)
  @ApiOperation({ summary: 'Roster of a unit within the Admin Head\'s department (403 outside scope) (ADMIN_HEAD+)' })
  getMyUnitRoster(@CurrentUser() user: AuthUser, @Param('unitId') unitId: string) {
    return this.departments.getMyUnitRoster(user, unitId);
  }

  @Post('mine/announcements')
  @Roles(Role.ADMIN_HEAD)
  @ApiOperation({ summary: 'Post an announcement scoped to a department the Admin Head heads (ADMIN_HEAD+)' })
  postMyAnnouncement(@CurrentUser() user: AuthUser, @Body() body: { departmentId?: string; title?: string; body?: string }) {
    if (!body?.departmentId) throw new BadRequestException('departmentId is required');
    return this.departments.postDeptAnnouncement(user, body.departmentId, body);
  }

  @Post('mine/units/:unitId/nudge')
  @Roles(Role.ADMIN_HEAD)
  @ApiOperation({ summary: 'Nudge a unit lead within the Admin Head\'s department (ADMIN_HEAD+)' })
  nudge(@CurrentUser() user: AuthUser, @Param('unitId') unitId: string, @Body() body: unknown) {
    return this.departments.nudgeLead(user, unitId, body);
  }

  // ── Admin: read ──────────────────────────────────────────────────────────────

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'All departments with head, unit + member counts, and unassigned units (ADMIN+)' })
  list() {
    return this.departments.list();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Department detail: units, current head, succession history (ADMIN+)' })
  getOne(@Param('id') id: string) {
    return this.departments.getOne(id);
  }

  // ── Admin: CRUD ──────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a department (ADMIN+)' })
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.departments.create(user, body);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a department (ADMIN+)' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.departments.update(user, id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a department; its units become unassigned (ADMIN+)' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.departments.remove(user, id);
  }

  // ── Admin: head assignment ───────────────────────────────────────────────────

  @Post(':id/head')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign a department head (ends the current tenure, starts a new one) (ADMIN+)' })
  assignHead(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.departments.assignHead(user, id, body);
  }

  @Delete(':id/head')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'End the current department head tenure (ADMIN+)' })
  removeHead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.departments.removeHead(user, id);
  }

  // ── Admin: unit assignment ───────────────────────────────────────────────────

  @Post(':id/units')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign units to a department (ADMIN+)' })
  assignUnits(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.departments.assignUnits(user, id, body);
  }

  @Delete(':id/units/:unitId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Unassign a unit from its department (ADMIN+)' })
  unassignUnit(@CurrentUser() user: AuthUser, @Param('unitId') unitId: string) {
    return this.departments.unassignUnit(user, unitId);
  }

  @Post(':id/announcements')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Post an announcement scoped to a department (ADMIN+)' })
  postAnnouncement(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.departments.postDeptAnnouncement(user, id, body);
  }
}
