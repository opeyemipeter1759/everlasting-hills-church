import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { UpdateUserRoleDto } from './dto/user.dto';
import { UsersRoleGrantsService } from './services/users-role-grants.service';

/** Additive multi-role grants and the global Head Usher assignment. */
@ApiTags('users')
@Controller('users')
@Roles(Role.HOD)
@ApiBearerAuth('access-token')
export class UsersGrantsController {
  constructor(private readonly grants: UsersRoleGrantsService) {}

  @Post(':profileId/grants')
  @ApiOperation({ summary: 'Grant a global role (PASTOR / ADMIN / SUPER_ADMIN), additive' })
  @ApiBody({ type: UpdateUserRoleDto })
  async grantRole(
    @CurrentUser() actor: AuthUser,
    @Param('profileId') profileId: string,
    @Body() body: UpdateUserRoleDto,
  ) {
    return this.grants.grantRole(actor, profileId, body.role);
  }

  @Delete(':profileId/grants/:role')
  @ApiOperation({ summary: 'Revoke a global role grant' })
  async revokeGrant(
    @CurrentUser() actor: AuthUser,
    @Param('profileId') profileId: string,
    @Param('role') role: Role,
  ) {
    return this.grants.revokeGrant(actor, profileId, role);
  }

  @Post(':profileId/head-usher')
  @ApiOperation({ summary: 'Assign Head Usher — global, unscoped, additive' })
  async assignHeadUsher(@CurrentUser() actor: AuthUser, @Param('profileId') profileId: string) {
    return this.grants.assignHeadUsher(actor, profileId);
  }

  @Delete(':profileId/head-usher')
  @ApiOperation({ summary: 'End an active Head Usher assignment' })
  async removeHeadUsher(@CurrentUser() actor: AuthUser, @Param('profileId') profileId: string) {
    return this.grants.removeHeadUsher(actor, profileId);
  }
}
