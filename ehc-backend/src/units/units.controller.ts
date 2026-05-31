import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { AssignUnitMemberDto, CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { UnitsService } from './units.service';

/**
 * Units endpoints.
 *
 * Layered authorization:
 *   - /units/me                                       → any authed user (returns null if not a lead)
 *   - GET /units, GET /units/:id, POST/PATCH/DELETE   → ADMIN+
 *   - POST /units/:id/members (add)                   → UNIT_LEAD of that unit OR ADMIN+
 *   - DELETE /units/:id/members/:memberId (remove)    → UNIT_LEAD of that unit OR ADMIN+
 *   - PATCH /units/:id/members/:memberId/lead         → ADMIN+ only (can't self-crown)
 */
@ApiTags('units')
@Controller('units')
@ApiBearerAuth('access-token')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  // ── Self ────────────────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get the unit the current user leads (or null)' })
  async getMyUnit(@CurrentUser() user: AuthUser) {
    return this.unitsService.findUnitLedBy(user.userId);
  }

  // ── Admin CRUD ──────────────────────────────────────────────────────────────

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all units (ADMIN+)' })
  async list() {
    return this.unitsService.listAll();
  }

  @Get(':unitId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get one unit with its members (ADMIN+)' })
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
  @ApiOperation({ summary: 'Update a unit (ADMIN+)' })
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

  // ── Member assignment (UNIT_LEAD or ADMIN+) ─────────────────────────────────

  @Post(':unitId/members')
  @ApiOperation({ summary: 'Add a member to a unit (lead of unit, or ADMIN+)' })
  @ApiBody({ type: AssignUnitMemberDto })
  @ApiOkResponse({ description: 'Member added' })
  async addMember(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Body() body: AssignUnitMemberDto,
  ) {
    return this.unitsService.addMember(actor, unitId, body);
  }

  @Delete(':unitId/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from a unit (lead of unit, or ADMIN+)' })
  async removeMember(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.unitsService.removeMember(actor, unitId, memberId);
  }

  @Patch(':unitId/members/:memberId/lead')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Promote/demote a unit lead (ADMIN+ only)' })
  @ApiBody({ schema: { example: { isLead: true } } })
  async setMemberLead(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('memberId') memberId: string,
    @Body('isLead') isLead: boolean,
  ) {
    return this.unitsService.setMemberLead(actor, unitId, memberId, !!isLead);
  }
}
