import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { SiteSettingsService } from './site-settings.service';

/**
 * Homepage content store.
 *
 *   GET  /site-settings           — public, returns every section in one shot
 *                                   (the homepage loads this on every render)
 *   GET  /site-settings/:section  — public, returns one section
 *   PUT  /site-settings/:section  — ADMIN, validated against the Zod schema
 *                                   for that section
 */
@ApiTags('site-settings')
@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly service: SiteSettingsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'All homepage sections',
    description: 'Returns every section keyed by name. Cached for 5 minutes.',
  })
  @ApiOkResponse({
    description: 'Map of section → { section, content, updatedAt, updatedBy }',
  })
  async getAll() {
    return this.service.findAll();
  }

  @Public()
  @Get(':section')
  @ApiOperation({ summary: 'One homepage section' })
  @ApiParam({
    name: 'section',
    enum: [
      'HERO',
      'ABOUT',
      'CULTURE',
      'SCRIPTURE',
      'SERVICE',
      'SERMONS',
      'COMMUNITY',
      'GIVING',
      'CONTACT',
    ],
  })
  async getOne(@Param('section') section: string) {
    return this.service.findOne(section);
  }

  @Roles(Role.ADMIN)
  @Put(':section')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update one homepage section',
    description:
      'Replaces the content blob for this section. Body is validated server-side by the section-specific Zod schema; mismatch returns 400 with field-level details.',
  })
  async putOne(
    @CurrentUser() actor: AuthUser,
    @Param('section') section: string,
    @Body() body: unknown,
  ) {
    return this.service.update(section, body, actor.userId);
  }
}
