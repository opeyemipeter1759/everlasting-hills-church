import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { AssignUnitMemberDto, SetMemberRoleDto } from './dto/unit.dto';
import { UnitLeadAppointmentService } from './services/unit-lead-appointment.service';
import { UnitsMembershipService } from './services/units-membership.service';
import { UnitsRoleService } from './services/units-role.service';

/**
 * Unit lead appointment (ADMIN_HEAD within their department, or ADMIN+) and member
 * assignment (lead/assistant of that unit, or ADMIN+).
 */
@ApiTags('units')
@Controller('units')
@ApiBearerAuth('access-token')
export class UnitsMembersController {
  constructor(
    private readonly leadAppointment: UnitLeadAppointmentService,
    private readonly membership: UnitsMembershipService,
    private readonly role: UnitsRoleService,
  ) {}

  @Post(':unitId/lead')
  @Roles(Role.ADMIN_HEAD)
  @ApiOperation({ summary: 'Appoint/replace a unit lead. ADMIN_HEAD limited to units in a department they head; ADMIN+ any unit.' })
  async appointLead(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Body() body: { profileId?: string },
  ) {
    return this.leadAppointment.appointLead(actor, unitId, body?.profileId ?? '');
  }

  @Delete(':unitId/lead')
  @Roles(Role.ADMIN_HEAD)
  @ApiOperation({ summary: 'End the current unit lead assignment (same scope rules as appoint)' })
  async removeLead(@CurrentUser() actor: AuthUser, @Param('unitId') unitId: string) {
    return this.leadAppointment.removeLead(actor, unitId);
  }

  @Post(':unitId/members')
  @ApiOperation({ summary: 'Add a member to a unit (lead or assistant of unit, or ADMIN+)' })
  @ApiBody({ type: AssignUnitMemberDto })
  @ApiOkResponse({ description: 'Member added to unit' })
  async addMember(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Body() body: AssignUnitMemberDto,
  ) {
    return this.membership.addMember(actor, unitId, body);
  }

  @Delete(':unitId/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from a unit (lead or assistant of unit, or ADMIN+)' })
  async removeMember(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membership.removeMember(actor, unitId, memberId);
  }

  @Patch(':unitId/members/:memberId')
  @Roles(Role.HOD)
  @ApiOperation({ summary: 'Set lead or assistant role for a unit member (ADMIN+, or HOD/ADMIN_HEAD scoped to their department, lead only)' })
  @ApiBody({ type: SetMemberRoleDto })
  async setMemberRoleShort(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('memberId') memberId: string,
    @Body() body: SetMemberRoleDto,
  ) {
    return this.role.setMemberRole(actor, unitId, memberId, body);
  }

  @Patch(':unitId/members/:memberId/role')
  @Roles(Role.HOD)
  @ApiOperation({ summary: 'Set lead or assistant role for a unit member (ADMIN+, or HOD/ADMIN_HEAD scoped to their department, lead only)' })
  @ApiBody({ type: SetMemberRoleDto })
  async setMemberRole(
    @CurrentUser() actor: AuthUser,
    @Param('unitId') unitId: string,
    @Param('memberId') memberId: string,
    @Body() body: SetMemberRoleDto,
  ) {
    return this.role.setMemberRole(actor, unitId, memberId, body);
  }
}
