import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CmsService } from './cms.service';

/**
 * Public-site CMS.
 *
 *   Public reads (no auth):   GET /cms/public/:key, GET /cms/preview?token=
 *   Editor (SUPER_ADMIN, PASTOR): everything else.
 *
 * The class is gated to PASTOR+ (the minimum to reach the editor); SUPER_ADMIN is
 * above PASTOR in the hierarchy so it inherits access. Every service query is
 * tenant-scoped.
 */
@ApiTags('cms')
@Controller('cms')
export class CmsController {
  constructor(private readonly cms: CmsService) {}

  // ── Public read path ─────────────────────────────────────────────────────────

  @Public()
  @Get('public/:key')
  @ApiOperation({ summary: 'Published content for a page (public site read)' })
  async getPublished(@Param('key') key: string) {
    return this.cms.getPublishedPage(decodeURIComponent(key));
  }

  @Public()
  @Get('preview')
  @ApiOperation({ summary: 'Resolve a signed preview token to draft content' })
  async preview(@Query('token') token?: string) {
    if (!token) throw new BadRequestException('token is required');
    return this.cms.resolvePreview(token);
  }

  @Public()
  @Get('site-config')
  @ApiOperation({ summary: 'Site-wide settings (identity, contact, socials, footer)' })
  getSiteConfig() {
    return this.cms.getSiteConfig();
  }

  // ── Editor: site-wide settings ─────────────────────────────────────────────────

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Put('site-config')
  @ApiOperation({ summary: 'Update site-wide settings (PASTOR+)' })
  updateSiteConfig(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.cms.updateSiteConfig(body, actor.userId);
  }

  // ── Editor: pages ────────────────────────────────────────────────────────────

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Get('pages')
  @ApiOperation({ summary: 'List every editable page + its status (PASTOR+)' })
  listPages() {
    return this.cms.listPages();
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Get('pages/:key')
  @ApiOperation({ summary: 'Editor view: page + working draft content (PASTOR+)' })
  getEditorPage(@CurrentUser() actor: AuthUser, @Param('key') key: string) {
    return this.cms.getEditorPage(decodeURIComponent(key), actor.userId);
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
    return this.cms.saveDraft(decodeURIComponent(key), body, actor.userId);
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Post('pages/:key/publish')
  @ApiOperation({ summary: 'Publish the working draft to the live site (PASTOR+)' })
  publish(@CurrentUser() actor: AuthUser, @Param('key') key: string) {
    return this.cms.publish(decodeURIComponent(key), actor.userId);
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Post('pages/:key/unpublish')
  @ApiOperation({ summary: 'Take the page offline (PASTOR+)' })
  unpublish(@CurrentUser() actor: AuthUser, @Param('key') key: string) {
    return this.cms.unpublish(decodeURIComponent(key), actor.userId);
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Post('pages/:key/preview-token')
  @ApiOperation({ summary: 'Mint a signed 1-hour preview token (PASTOR+)' })
  previewToken(@Param('key') key: string) {
    return this.cms.createPreviewToken(decodeURIComponent(key));
  }

  // ── Editor: version history ──────────────────────────────────────────────────

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Get('pages/:key/versions')
  @ApiOperation({ summary: 'Version history for a page (PASTOR+)' })
  listVersions(@Param('key') key: string) {
    return this.cms.listVersions(decodeURIComponent(key));
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Get('pages/:key/versions/:version')
  @ApiOperation({ summary: 'A single historical version snapshot (PASTOR+)' })
  getVersion(@Param('key') key: string, @Param('version') version: string) {
    return this.cms.getVersion(decodeURIComponent(key), Number(version));
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
    return this.cms.rollback(decodeURIComponent(key), Number(version), actor.userId);
  }

  // ── Editor: media library ────────────────────────────────────────────────────

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Get('media')
  @ApiOperation({ summary: 'List media assets (PASTOR+)' })
  listMedia() {
    return this.cms.listMedia();
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Post('media')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a media asset to R2 (alt text required) (PASTOR+)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        alt: { type: 'string' },
        width: { type: 'number' },
        height: { type: 'number' },
      },
    },
  })
  uploadMedia(
    @CurrentUser() actor: AuthUser,
    @UploadedFile()
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined,
    @Body() body: { alt?: string; width?: string; height?: string },
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.cms.uploadMedia(
      file,
      {
        alt: body.alt ?? '',
        width: body.width ? Number(body.width) : undefined,
        height: body.height ? Number(body.height) : undefined,
      },
      actor.userId,
    );
  }

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Delete('media/:id')
  @ApiOperation({ summary: 'Delete a media asset (PASTOR+)' })
  deleteMedia(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.cms.deleteMedia(id, actor.userId);
  }

  // ── Audit ────────────────────────────────────────────────────────────────────

  @Roles(Role.PASTOR)
  @ApiBearerAuth('access-token')
  @Get('audit')
  @ApiOperation({ summary: 'Recent CMS audit-log entries (PASTOR+)' })
  listAudit(@Query('limit') limit?: string) {
    return this.cms.listAudit(limit ? Number(limit) : 50);
  }
}
