import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { parseSchema } from '../common/zod-parse.util';
import { createGatheringSchema, updateGatheringSchema } from './gatherings.schemas';
import { GatheringsService } from './gatherings.service';

/**
 * Recurring gatherings — the daily prayer meeting and anything shaped like it.
 *
 * Writes are ADMIN+; RolesGuard honours the hierarchy, so ADMIN_HEAD, PASTOR
 * and SUPER_ADMIN are admitted by the class-level gate. The member-facing read
 * lowers that to MEMBER on the one route that needs it.
 *
 * Thin controller: validate with Zod, delegate to the service.
 */
@ApiTags('gatherings')
@ApiBearerAuth('access-token')
@Controller('gatherings')
@Roles(Role.ADMIN)
export class GatheringsController {
  constructor(private readonly gatherings: GatheringsService) {}

  /**
   * Active gatherings with their next occurrence, for the member dashboard.
   * Authenticated rather than public: a join URL is a meeting credential, and
   * the .ics route already covers the public "when is it" case.
   */
  @Get()
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Active gatherings with next occurrence and live state' })
  list() {
    return this.gatherings.listActive();
  }

  @Get('manage')
  @ApiOperation({ summary: 'All gatherings including inactive — admin view' })
  listAll() {
    return this.gatherings.listAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a recurring gathering' })
  create(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.gatherings.create(actor, parseSchema(createGatheringSchema, body));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a recurring gathering' })
  update(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.gatherings.update(actor, id, parseSchema(updateGatheringSchema, body));
  }

  /**
   * Hard delete. Deactivating (`isActive: false`) is the reversible option and
   * is what the UI should offer first; this exists for genuine mistakes.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a recurring gathering' })
  remove(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.gatherings.remove(actor, id);
  }
}
