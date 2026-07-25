import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CmsPublicReadService } from './services/cms-public-read.service';
import { CmsPreviewService } from './services/cms-preview.service';
import { CmsSiteConfigService } from './services/cms-site-config.service';
import { CmsPageCoreService } from './services/cms-page-core.service';
import { CmsDraftService } from './services/cms-draft.service';
import { CmsPublishService } from './services/cms-publish.service';

/**
 * Public-site CMS: public reads, site config, and the page editor core.
 * See cms-versions.controller.ts and cms-media.controller.ts for the rest.
 *
 *   Public reads (no auth):   GET /cms/public/:key, GET /cms/preview?token=
 *   Editor (SUPER_ADMIN, PASTOR): everything else.
 */
@ApiTags('cms')
@Controller('cms')
export class CmsController {
  constructor(
    private readonly publicRead: CmsPublicReadService,
    private readonly preview: CmsPreviewService,
    private readonly siteConfig: CmsSiteConfigService,
    private readonly pageCore: CmsPageCoreService,
    private readonly draft: CmsDraftService,
    private readonly publish_: CmsPublishService,
  ) {}

  @Public()
  @Get('public/:key')
  @ApiOperation({ summary: 'Published content for a page (public site read)' })
  async getPublished(@Param('key') key: string) {
    return this.publicRead.getPublishedPage(decodeURIComponent(key));
  }

  @Public()
  @Get('preview')
  @ApiOperation({ summary: 'Resolve a signed preview token to draft content' })
  async previewGet(@Query('token') token?: string) {
    if (!token) throw new BadRequestException('token is required');
    return this.preview.resolvePreview(token);
  }

  @Public()
  @Get('site-config')
  @ApiOperation({ summary: 'Site-wide settings (identity, contact, socials, footer)' })
  getSiteConfig() {
    return this.siteConfig.getSiteConfig();
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Put('site-config')
  @ApiOperation({ summary: 'Update site-wide settings (PASTOR+)' })
  updateSiteConfig(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.siteConfig.updateSiteConfig(body, actor.userId);
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Get('pages')
  @ApiOperation({ summary: 'List every editable page + its status (PASTOR+)' })
  listPages() {
    return this.pageCore.listPages();
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Get('pages/:key')
  @ApiOperation({ summary: 'Editor view: page + working draft content (PASTOR+)' })
  getEditorPage(@CurrentUser() actor: AuthUser, @Param('key') key: string) {
    return this.pageCore.getEditorPage(decodeURIComponent(key), actor.userId);
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Post('pages/:key/draft')
  @ApiOperation({ summary: 'Save the working draft (validated, not live) (PASTOR+)' })
  saveDraft(
    @CurrentUser() actor: AuthUser,
    @Param('key') key: string,
    @Body() body: { title?: string; content: unknown },
  ) {
    return this.draft.saveDraft(decodeURIComponent(key), body, actor.userId);
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Post('pages/:key/publish')
  @ApiOperation({ summary: 'Publish the working draft to the live site (PASTOR+)' })
  publish(@CurrentUser() actor: AuthUser, @Param('key') key: string) {
    return this.publish_.publish(decodeURIComponent(key), actor.userId);
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Post('pages/:key/unpublish')
  @ApiOperation({ summary: 'Take the page offline (PASTOR+)' })
  unpublish(@CurrentUser() actor: AuthUser, @Param('key') key: string) {
    return this.publish_.unpublish(decodeURIComponent(key), actor.userId);
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Post('pages/:key/preview-token')
  @ApiOperation({ summary: 'Mint a signed 1-hour preview token (PASTOR+)' })
  previewToken(@Param('key') key: string) {
    return this.preview.createPreviewToken(decodeURIComponent(key));
  }
}
