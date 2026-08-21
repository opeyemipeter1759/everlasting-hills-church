import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { DepartmentsReadService } from './services/departments-read.service';
import { DepartmentsCrudService } from './services/departments-crud.service';
import { DepartmentHeadService } from './services/department-head.service';
import { DepartmentHodService } from './services/department-hod.service';
import { DepartmentsUnitsService } from './services/departments-units.service';
import { DepartmentsEngagementService } from './services/departments-engagement.service';

/**
 * Administrative departments.
 *
 * ADMIN is merged into ADMIN_HEAD (same hierarchy level) — Admin Head is the
 * sole, full church-wide admin tier now; ADMIN is legacy, kept only so existing
 * grants keep working. Management routes are @Roles(ADMIN): since both roles
 * share a level, this equally admits ADMIN_HEAD/PASTOR/SUPER_ADMIN.
 * HOD assignment itself (/:id/hods) is @Roles(ADMIN_HEAD): a department's Admin
 * Head (or Pastor/Super Admin) appoints its HODs — church-wide for a merged
 * Admin Head, or scoped to their own department for a department-only one
 * (see DepartmentsScopeService.assertCanAssignHod).
 *
 * See departments-mine.controller.ts for the Admin Head/HOD scoped surface —
 * it's registered before this controller so /mine is never captured by /:id.
 */
@ApiTags('departments')
@Controller('departments')
@ApiBearerAuth('access-token')
export class DepartmentsController {
  constructor(
    private readonly read: DepartmentsReadService,
    private readonly crud: DepartmentsCrudService,
    private readonly head: DepartmentHeadService,
    private readonly hod: DepartmentHodService,
    private readonly units: DepartmentsUnitsService,
    private readonly engagement: DepartmentsEngagementService,
  ) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'All departments with head, unit + member counts, and unassigned units (ADMIN+)' })
  list() {
    return this.read.list();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Department detail: units, current head, succession history (ADMIN+)' })
  getOne(@Param('id') id: string) {
    return this.read.getOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a department (ADMIN+)' })
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.crud.create(user, body);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a department (ADMIN+)' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.crud.update(user, id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a department; its units become unassigned (ADMIN+)' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.crud.remove(user, id);
  }

  @Post(':id/head')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign a department head (ends the current tenure, starts a new one) (ADMIN+)' })
  assignHead(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.head.assignHead(user, id, body);
  }

  @Delete(':id/head')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'End the current department head tenure (ADMIN+)' })
  removeHead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.head.removeHead(user, id);
  }

  @Post(':id/hods')
  @Roles(Role.ADMIN_HEAD)
  @ApiOperation({ summary: 'Appoint an HOD under this department (ADMIN_HEAD+, scoped to a department they head)' })
  assignHod(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.hod.assignHod(user, id, body);
  }

  @Delete(':id/hods/:profileId')
  @Roles(Role.ADMIN_HEAD)
  @ApiOperation({ summary: 'End an HOD tenure under this department (ADMIN_HEAD+, scoped to a department they head)' })
  removeHod(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('profileId') profileId: string) {
    return this.hod.removeHod(user, id, profileId);
  }

  @Post(':id/units')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign units to a department (ADMIN+)' })
  assignUnits(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.units.assignUnits(user, id, body);
  }

  @Post(':id/units/new')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a brand-new unit directly under this department (ADMIN+)' })
  createUnit(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.units.createUnit(user, id, body);
  }

  @Delete(':id/units/:unitId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Unassign a unit from its department (ADMIN+)' })
  unassignUnit(@CurrentUser() user: AuthUser, @Param('unitId') unitId: string) {
    return this.units.unassignUnit(user, unitId);
  }

  @Post(':id/announcements')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Post an announcement scoped to a department (ADMIN+)' })
  postAnnouncement(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.engagement.postDeptAnnouncement(user, id, body);
  }
}
