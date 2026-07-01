import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { AssignUnitMemberDto, CreateUnitDto, SetMemberRoleDto, UpdateUnitDto } from './dto/unit.dto';
import { UnitsService } from './units.service';

/**
 * Units endpoints.
 *
 * Authorization:
 *   GET  /units/directory                               → ADMIN+
 *   GET  /units/me                                      → any authed user
 *   GET  /units, GET /units/:id, POST/PATCH/DELETE      → ADMIN+
 *   POST /units/:id/members (add)                       → LEAD or ASSISTANT of that unit, OR ADMIN+
 *   DELETE /units/:id/members/:memberId (remove)        → LEAD or ASSISTANT of that unit, OR ADMIN+
 *   PATCH /units/:id/members/:memberId/role             → ADMIN+ only
 */
@ApiTags('units')
@Controller('units')
@ApiBearerAuth('access-token')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  // ── Directory ───────────────────────────────────────────────────────────────

  @Get('directory')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'All units with leads/assistants + all leadership profiles (ADMIN+)' })
  @ApiOkResponse({
    description: 'Units with lead/assistant, plus all UNIT_LEAD / ADMIN / PASTOR / SUPER_ADMIN profiles',
  })
  async getDirectory() {
    return this.unitsService.getDirectory();
  }

  // ── Self ────────────────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get the unit the current user leads or assists (or null)' })
  async getMyUnit(@CurrentUser() user: AuthUser) {
    return this.unitsService.findMyUnit(user.userId);
  }

  // ── Admin CRUD ──────────────────────────────────────────────────────────────

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all units with lead + assistant (ADMIN+)' })
  async list() {
    return this.unitsService.listAll();
  }

  @Get(':unitId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get one unit with full member list including roles (ADMIN+)' })
  async getById(@Param('unitId') unitId: string) {
    return this.unitsService.getById(unitId);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new unit (ADMIN+)' })
  @ApiBody({ type: CreateUnitDto })
  async create(@Body() body: CreateUnitDto) {
    return this.unitsService.create(body);
  }

  @Patch(':unitId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a unit name/description (ADMIN+)' })
  @ApiBody({ type: UpdateUnitDto })
  async update(@Param('unitId') unitId: string, @Body() body: UpdateUnitDto) {
    return this.unitsService.update(unitId, body);
  }

  @Delete(':unitId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a unit (ADMIN+)' })
  async delete(@Param('unitId') unitId: string) {
    return this.unitsService.delete(unitId);
  }

  // ── Member assignment (LEAD / ASSISTANT or ADMIN+) ──────────────────────────

  @Post(':unitId/members')
  @ApiOperation({ summary: 'Add a member to a unit (lead or assistant of unit, or ADMIN+)' })
  @ApiBody({ type: AssignUnitMemberDto })
  @ApiOkResponse({ description: 'Member added to unit' })
  async addMember(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Body() body: AssignUnitMemberDto,
  ) {
    return this.unitsService.addMember(actor, unitId, body);
  }

  @Delete(':unitId/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from a unit (lead or assistant of unit, or ADMIN+)' })
  async removeMember(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.unitsService.removeMember(actor, unitId, memberId);
  }

  @Patch(':unitId/members/:memberId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Set lead or assistant role for a unit member (ADMIN+ only)' })
  @ApiBody({ type: SetMemberRoleDto })
  async setMemberRoleShort(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('memberId') memberId: string,
    @Body() body: SetMemberRoleDto,
  ) {
    return this.unitsService.setMemberRole(actor, unitId, memberId, body);
  }

  @Patch(':unitId/members/:memberId/role')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Set lead or assistant role for a unit member (ADMIN+ only)' })
  @ApiBody({ type: SetMemberRoleDto })
  async setMemberRole(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('memberId') memberId: string,
    @Body() body: SetMemberRoleDto,
  ) {
    return this.unitsService.setMemberRole(actor, unitId, memberId, body);
  }
}
