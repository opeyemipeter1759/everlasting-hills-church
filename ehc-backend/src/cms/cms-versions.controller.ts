import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CmsVersionsService } from './services/cms-versions.service';
import { CmsPublishService } from './services/cms-publish.service';
import { decodeCmsKey } from './page-registry';

@ApiTags('cms')
@Controller('cms')
export class CmsVersionsController {
  constructor(
    private readonly versions: CmsVersionsService,
    private readonly publish: CmsPublishService,
  ) {}

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Get('pages/:key/versions')
  @ApiOperation({ summary: 'Version history for a page (PASTOR+)' })
  listVersions(@Param('key') key: string) {
    return this.versions.listVersions(decodeCmsKey(key));
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Get('pages/:key/versions/:version')
  @ApiOperation({ summary: 'A single historical version snapshot (PASTOR+)' })
  getVersion(@Param('key') key: string, @Param('version') version: string) {
    return this.versions.getVersion(decodeCmsKey(key), Number(version));
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Post('pages/:key/versions/:version/restore')
  @ApiOperation({ summary: 'Restore (republish) a prior version (PASTOR+)' })
  rollback(
    @CurrentUser() actor: AuthUser,
    @Param('key') key: string,
    @Param('version') version: string,
  ) {
    return this.publish.rollback(decodeCmsKey(key), Number(version), actor.userId);
  }
}
