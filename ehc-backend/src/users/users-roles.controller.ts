import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { UpdateUserRoleDto } from './dto/user.dto';
import { UsersRolesOverviewService } from './services/users-roles-overview.service';
import { UsersListByRoleService } from './services/users-list-by-role.service';
import { UsersAuthService } from './services/users-auth.service';
import { UsersUpdateService } from './services/users-update.service';

@ApiTags('users')
@Controller('users')
@Roles(Role.HOD)
@ApiBearerAuth('access-token')
export class UsersRolesController {
  constructor(
    private readonly rolesOverview: UsersRolesOverviewService,
    private readonly listByRole: UsersListByRoleService,
    private readonly usersAuth: UsersAuthService,
    private readonly usersUpdate: UsersUpdateService,
  ) {}

  @Get('roles')
  @ApiOperation({ summary: 'All roles in the system with label and hierarchy level' })
  @ApiOkResponse({
    schema: {
      example: [
        { role: 'SUPER_ADMIN', label: 'Super Admin', level: 5 },
        { role: 'PASTOR', label: 'Pastor', level: 4 },
      ],
    },
  })
  async getAllRoles() {
    return this.rolesOverview.getAllRoles();
  }

  @Get('by-role')
  @ApiOperation({
    summary: 'All members grouped by role',
    description: 'Returns every profile organised by role. UNIT_LEAD entries include which units they lead or assist.',
  })
  async listByRole_() {
    return this.listByRole.listByRole();
  }

  @Get('assignable-roles')
  @ApiOperation({ summary: 'Roles the current user can create/assign' })
  @ApiOkResponse({
    description: 'Array of roles the actor can assign',
    schema: { example: ['MEMBER', 'UNIT_LEAD'] },
  })
  async assignableRoles(@CurrentUser() user: AuthUser) {
    return this.usersAuth.assignableRolesFor(user);
  }

  @Patch(':profileId/role')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Set a user single granted role (People dropdown)' })
  @ApiBody({ type: UpdateUserRoleDto })
  async updateRole(
    @CurrentUser() actor: AuthUser,
    @Param('profileId') profileId: string,
    @Body() body: UpdateUserRoleDto,
  ) {
    return this.usersUpdate.updateRole(actor, profileId, body);
  }
}
