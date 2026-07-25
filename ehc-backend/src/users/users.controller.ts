import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { BulkCreateUsersDto, CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UsersListService } from './services/users-list.service';
import { UsersCreateService } from './services/users-create.service';
import { UsersBulkCreateService } from './services/users-bulk-create.service';
import { UsersUpdateService } from './services/users-update.service';
import { UsersDeletionService } from './services/users-deletion.service';

/**
 * Core user CRUD. Class-gate at HOD (see users.module.ts sibling controllers for
 * the roles/grants split); individual routes here are overridden back up to ADMIN.
 */
@ApiTags('users')
@Controller('users')
@Roles(Role.HOD)
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(
    private readonly usersList: UsersListService,
    private readonly usersCreate: UsersCreateService,
    private readonly usersBulkCreate: UsersBulkCreateService,
    private readonly usersUpdate: UsersUpdateService,
    private readonly usersDeletion: UsersDeletionService,
  ) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all users (profile + member)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  async list(@Query('search') search?: string, @Query('role') role?: Role) {
    return this.usersList.list({ search, role });
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create a new user with a role',
    description:
      'Creates a Supabase auth user, Profile, and Member in one flow. Phone number is the initial password.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ description: 'User created' })
  async create(@CurrentUser() actor: AuthUser, @Body() body: CreateUserDto) {
    return this.usersCreate.create(actor, body);
  }

  @Post('bulk')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create one or many people at once',
    description:
      'Each row creates a Supabase auth user + Profile + Member (phone = initial password). A failed row does not abort the batch; failures are returned.',
  })
  @ApiBody({ type: BulkCreateUsersDto })
  @ApiCreatedResponse({ description: 'Batch result: { created[], failed[], total }' })
  async bulkCreate(@CurrentUser() actor: AuthUser, @Body() body: BulkCreateUsersDto) {
    return this.usersBulkCreate.bulkCreate(actor, body.members);
  }

  @Patch(':profileId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user profile (name/phone)' })
  @ApiBody({ type: UpdateUserDto })
  async updateProfile(
    @CurrentUser() actor: AuthUser,
    @Param('profileId') profileId: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersUpdate.updateProfile(actor, profileId, body);
  }

  @Delete(':profileId')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Permanently delete a user',
    description:
      'Removes the Profile, Member, all member-related records, and the Supabase auth user. Cannot be undone.',
  })
  async deleteUser(@CurrentUser() actor: AuthUser, @Param('profileId') profileId: string) {
    return this.usersDeletion.deleteUser(actor, profileId);
  }
}
