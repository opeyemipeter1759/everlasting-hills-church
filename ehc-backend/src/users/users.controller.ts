import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import {
  BulkCreateUsersDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserRoleDto,
} from './dto/user.dto';
import { UsersService } from './users.service';

/**
 * User management.
 *
 * Class-gate at ADMIN — that's the minimum to even SEE this endpoint. The actual
 * authorization for any specific role action (create PASTOR vs MEMBER, etc.) is
 * enforced per-call in the service via `canActOnRole`. The gate just keeps
 * UNIT_LEAD and MEMBER out entirely.
 */
@ApiTags('users')
@Controller('users')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
    return this.usersService.getAllRoles();
  }

  @Get('by-role')
  @ApiOperation({
    summary: 'All members grouped by role',
    description: 'Returns every profile organised by role. UNIT_LEAD entries include which units they lead or assist.',
  })
  async listByRole() {
    return this.usersService.listByRole();
  }

  @Get('assignable-roles')
  @ApiOperation({ summary: 'Roles the current user can create/assign' })
  @ApiOkResponse({
    description: 'Array of roles the actor can assign',
    schema: { example: ['MEMBER', 'UNIT_LEAD'] },
  })
  async assignableRoles(@CurrentUser() user: AuthUser) {
    return this.usersService.assignableRolesFor(user);
  }

  @Get()
  @ApiOperation({ summary: 'List all users (profile + member)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  async list(@Query('search') search?: string, @Query('role') role?: Role) {
    return this.usersService.list({ search, role });
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new user with a role',
    description:
      'Creates a Supabase auth user, Profile, and Member in one flow. Phone number is the initial password.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ description: 'User created' })
  async create(@CurrentUser() actor: AuthUser, @Body() body: CreateUserDto) {
    return this.usersService.create(actor, body);
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Create one or many people at once',
    description:
      'Each row creates a Supabase auth user + Profile + Member (phone = initial password). A failed row does not abort the batch; failures are returned.',
  })
  @ApiBody({ type: BulkCreateUsersDto })
  @ApiCreatedResponse({ description: 'Batch result: { created[], failed[], total }' })
  async bulkCreate(@CurrentUser() actor: AuthUser, @Body() body: BulkCreateUsersDto) {
    return this.usersService.bulkCreate(actor, body.members);
  }

  @Patch(':profileId/role')
  @ApiOperation({ summary: 'Change a user role' })
  @ApiBody({ type: UpdateUserRoleDto })
  async updateRole(
    @CurrentUser() actor: AuthUser,
    @Param('profileId') profileId: string,
    @Body() body: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(actor, profileId, body);
  }

  @Patch(':profileId')
  @ApiOperation({ summary: 'Update user profile (name/phone)' })
  @ApiBody({ type: UpdateUserDto })
  async updateProfile(
    @CurrentUser() actor: AuthUser,
    @Param('profileId') profileId: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(actor, profileId, body);
  }

  @Delete(':profileId')
  @ApiOperation({
    summary: 'Permanently delete a user',
    description:
      'Removes the Profile, Member, all member-related records, and the Supabase auth user. Cannot be undone.',
  })
  async deleteUser(
    @CurrentUser() actor: AuthUser,
    @Param('profileId') profileId: string,
  ) {
    return this.usersService.deleteUser(actor, profileId);
  }
}
