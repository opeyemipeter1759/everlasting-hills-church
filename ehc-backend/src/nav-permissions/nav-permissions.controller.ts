import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { SetNavPermissionsDto } from './dto/set-nav-permissions.dto';
import { CreateNavGrantDto } from './dto/nav-permission-grant.dto';
import { NavPermissionsService } from './services/nav-permissions.service';

/**
 * Admin-configurable sidebar/route access. Reading the current overrides is
 * MEMBER+ (every signed-in user's own sidebar and the route middleware both
 * need this to compute their effective access) — the data itself isn't
 * sensitive, it's just "which roles can see the Sermons link". Editing is
 * SUPER_ADMIN-only: this is the control plane for every other role's access,
 * so getting it wrong is exactly the kind of mistake that shouldn't be one
 * misclick away for anyone below the top of the hierarchy.
 */
@ApiTags('nav-permissions')
@Controller('nav-permissions')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class NavPermissionsController {
  constructor(private readonly permissions: NavPermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Current per-item role overrides (MEMBER+ — needed by every sidebar/route check)' })
  async getAll() {
    return this.permissions.getAll();
  }

  @Put()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Replace the role overrides for the given items (SUPER_ADMIN only)' })
  @ApiBody({ type: SetNavPermissionsDto })
  async setAll(@Body() body: SetNavPermissionsDto) {
    return this.permissions.setAll(body.items);
  }

  @Delete()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Revert one item to its static default (SUPER_ADMIN only)' })
  @ApiQuery({ name: 'itemHref', required: true })
  async resetOne(@Query('itemHref') itemHref?: string) {
    if (!itemHref) throw new BadRequestException('itemHref is required');
    await this.permissions.resetOne(itemHref);
    return { itemHref, reset: true };
  }

  @Get('my-grants')
  @ApiOperation({ summary: 'Nav items the caller can reach via a named person/unit exception (MEMBER+, self-scoped only)' })
  async myGrants(@CurrentUser() actor: AuthUser) {
    return { hrefs: await this.permissions.getGrantedHrefsForActor(actor) };
  }

  @Get('grants')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Every named person/unit exception, with display names resolved (SUPER_ADMIN only)' })
  async listGrants() {
    return this.permissions.getAllGrants();
  }

  @Post('grants')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a named exception granting one person/unit access to one item (SUPER_ADMIN only)' })
  @ApiBody({ type: CreateNavGrantDto })
  async addGrant(@Body() body: CreateNavGrantDto) {
    return this.permissions.addGrant(body);
  }

  @Delete('grants/:id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove a named exception (SUPER_ADMIN only)' })
  async removeGrant(@Param('id') id: string) {
    await this.permissions.removeGrant(id);
    return { id, removed: true };
  }
}
