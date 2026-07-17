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
 * ADMIN is merged into ADMIN_HEAD (same hierarchy level) — Admin Head is the
 * sole, full church-wide admin tier now; ADMIN is legacy, kept only so existing
 * grants keep working. Management routes are @Roles(ADMIN): since both roles
 * share a level, this equally admits ADMIN_HEAD/PASTOR/SUPER_ADMIN.
 * The /mine routes are @Roles(HOD): admits HOD and ADMIN_HEAD (and above); their
 * scope is resolved per request from active DepartmentHead + DepartmentHod rows
 * in the service layer — an HOD only ever sees the departments they're an HOD of,
 * and can only appoint unit leads there (see UnitsService.setMemberRole).
 * HOD assignment itself (/:id/hods) is @Roles(ADMIN_HEAD): a department's Admin
 * Head (or Pastor/Super Admin) appoints its HODs — church-wide for a merged
 * Admin Head, or scoped to their own department for a department-only one
 * (see DepartmentsService.assertCanAssignHod).
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
  @Roles(Role.HOD)
  @ApiOperation({ summary: 'Departments the current Admin Head/HOD oversees, with units + counts (HOD+)' })
  getMine(@CurrentUser() user: AuthUser) {
    return this.departments.getMine(user);
  }

  @Get('mine/units/:unitId/roster')
  @Roles(Role.HOD)
  @ApiOperation({ summary: 'Roster of a unit within the actor\'s department (403 outside scope) (HOD+)' })
  getMyUnitRoster(@CurrentUser() user: AuthUser, @Param('unitId') unitId: string) {
    return this.departments.getMyUnitRoster(user, unitId);
  }

  @Post('mine/announcements')
  @Roles(Role.HOD)
  @ApiOperation({ summary: 'Post an announcement scoped to a department the actor leads (HOD+)' })
  postMyAnnouncement(@CurrentUser() user: AuthUser, @Body() body: { departmentId?: string; title?: string; body?: string }) {
    if (!body?.departmentId) throw new BadRequestException('departmentId is required');
    return this.departments.postDeptAnnouncement(user, body.departmentId, body);
  }

  @Post('mine/units/:unitId/nudge')
  @Roles(Role.HOD)
  @ApiOperation({ summary: 'Nudge a unit lead within the actor\'s department (HOD+)' })
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

  // ── HOD assignment (Admin Head+; scoped to their own department) ─────────────

  @Post(':id/hods')
  @Roles(Role.ADMIN_HEAD)
  @ApiOperation({ summary: 'Appoint an HOD under this department (ADMIN_HEAD+, scoped to a department they head)' })
  assignHod(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.departments.assignHod(user, id, body);
  }

  @Delete(':id/hods/:profileId')
  @Roles(Role.ADMIN_HEAD)
  @ApiOperation({ summary: 'End an HOD tenure under this department (ADMIN_HEAD+, scoped to a department they head)' })
  removeHod(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('profileId') profileId: string) {
    return this.departments.removeHod(user, id, profileId);
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
