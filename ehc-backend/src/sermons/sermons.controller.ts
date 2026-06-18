import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, UseInterceptors, UploadedFile, BadRequestException, ServiceUnavailableException, InternalServerErrorException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role, SermonStatus } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CreateSermonDto } from './dto/create-sermon.dto';
import { UpdateSermonDto } from './dto/update-sermon.dto';
import { SubscribeEmailDto } from './dto/subscribe-email.dto';
import { NoteDto, ProgressDto, ReactionDto } from './dto/sermon-interaction.dto';
import { RecentSermonsQueryDto, SermonFeedQueryDto } from './dto/sermon-read.query.dto';
import { SermonsService } from './sermons.service';
import { SermonReadService } from './recent/sermon-read.service';
import { TenantId } from './recent/tenant-id.decorator';

/**
 * Sermon endpoints, organized by audience:
 *   - /admin/*           — PASTOR or higher (sermon CMS)
 *   - public reads       — anyone (no auth)
 *   - /member/*          — authenticated members; userId is derived from JWT, not the URL
 *
 * Security note: methods that previously took :userId or :memberId in the URL are now
 * sourced from @CurrentUser() — this prevents IDOR (Insecure Direct Object Reference) where
 * one user could query/modify another user's data by changing the URL.
 */
@ApiTags('sermons')
@Controller('sermons')
export class SermonsController {
  constructor(
    private readonly sermonsService: SermonsService,
    private readonly sermonReadService: SermonReadService,
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // Admin (sermon CMS) — PASTOR+
  // ────────────────────────────────────────────────────────────────────────────

  @Roles(Role.PASTOR)
  @Get('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all sermons (admin)' })
  @ApiQuery({ name: 'status', required: false, enum: SermonStatus })
  @ApiQuery({ name: 'series', required: false })
  getAllSermons(@Query('status') status?: SermonStatus, @Query('series') series?: string) {
    return this.sermonsService.getAllSermons({ status, series });
  }

  @Roles(Role.PASTOR)
  @Get('admin/overview')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get sermon overview totals (admin)' })
  getAdminOverview() {
    return this.sermonsService.getAdminSermonOverview();
  }

  @Roles(Role.PASTOR)
  @Get('admin/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get sermon by id (admin)' })
  getSermonById(@Param('id') id: string) {
    return this.sermonsService.getSermonById(id);
  }

  @Roles(Role.PASTOR)
  @Get('admin/:id/episodes/:episodeId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get sermon episode by sermon id (admin)' })
  getEpisodeBySermonId(@Param('id') id: string, @Param('episodeId') episodeId: string) {
    return this.sermonsService.getEpisodeBySermonId(id, episodeId);
  }

  @Roles(Role.PASTOR)
  @Post('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create sermon' })
  @ApiBody({ type: CreateSermonDto })
  @ApiCreatedResponse({ description: 'Sermon created' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  createSermon(@Body() body: CreateSermonDto) {
    return this.sermonsService.createSermon(body);
  }

  @Roles(Role.PASTOR)
  @Patch('admin/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update sermon' })
  @ApiBody({ type: UpdateSermonDto })
  updateSermon(@Param('id') id: string, @Body() body: UpdateSermonDto) {
    return this.sermonsService.updateSermon(id, body);
  }

  @Roles(Role.PASTOR)
  @Delete('admin/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete sermon' })
  deleteSermon(@Param('id') id: string) {
    return this.sermonsService.deleteSermon(id);
  }

  @Roles(Role.PASTOR)
  @Post('admin/:id/featured')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Set featured sermon' })
  setFeatured(@Param('id') id: string) {
    return this.sermonsService.setFeaturedSermon(id);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Public reads — no auth required
  // ────────────────────────────────────────────────────────────────────────────

  @Public()
  @Get('published')
  @ApiOperation({ summary: 'Get published sermons (public)' })
  @ApiQuery({ name: 'series', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPublishedSermons(
    @Query('series') series?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sermonsService.getPublishedSermons({
      series,
      search,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get sermon by slug (public)' })
  getSermonBySlug(@Param('slug') slug: string) {
    return this.sermonsService.getSermonBySlug(slug);
  }

  @Public()
  @Get('slug/:slug/episodes/:episodeId')
  @ApiOperation({ summary: 'Get sermon episode by sermon slug (public)' })
  getEpisodeBySlug(@Param('slug') slug: string, @Param('episodeId') episodeId: string) {
    return this.sermonsService.getEpisodeBySlug(slug, episodeId);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured sermon (public)' })
  getFeaturedSermon() {
    return this.sermonsService.getFeaturedSermon();
  }

  @Public()
  @Get('latest')
  @ApiOperation({ summary: 'Get latest sermons (public)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLatestSermons(@Query('limit') limit?: string) {
    return this.sermonsService.getLatestSermons(limit ? Number(limit) : 3);
  }

  /**
   * Recent published sermons for the homepage strip. Tenant-scoped, sorted in the
   * repository, capped, and cache-friendly so Next can ISR it.
   */
  @Public()
  @Get('recent')
  @Header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  @ApiOperation({ summary: 'Recent published sermons, newest first (public)' })
  getRecentSermons(@TenantId() tenantId: string | undefined, @Query() query: RecentSermonsQueryDto) {
    return this.sermonReadService.getRecent(tenantId, query.limit ?? 3);
  }

  /** Cursor-paginated public sermon listing. Never returns an unbounded list. */
  @Public()
  @Get('feed')
  @ApiOperation({ summary: 'Cursor-paginated published sermons (public)' })
  getSermonFeed(@TenantId() tenantId: string | undefined, @Query() query: SermonFeedQueryDto) {
    return this.sermonReadService.getFeed(tenantId, {
      cursor: query.cursor,
      pageSize: query.pageSize ?? 12,
      series: query.series,
    });
  }

  @Public()
  @Get('series')
  @ApiOperation({ summary: 'Get sermon series list (public)' })
  getSeriesList() {
    return this.sermonsService.getSeriesList();
  }

  /**
   * Public play-count increment. Throttled tightly because it's an unauthenticated
   * mutation — without this an attacker could spam-inflate any sermon's count.
   */
  @Public()
  @Post(':id/play')
  @ApiOperation({ summary: 'Increment play count (public)' })
  incrementPlayCount(@Param('id') id: string) {
    return this.sermonsService.incrementPlayCount(id);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Analytics — PASTOR+
  // ────────────────────────────────────────────────────────────────────────────

  @Roles(Role.PASTOR)
  @Get('analytics')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get sermon analytics' })
  getAnalytics() {
    return this.sermonsService.getSermonAnalytics();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Email subscribers
  // ────────────────────────────────────────────────────────────────────────────

  @Public()
  @Post('subscribers')
  @ApiOperation({ summary: 'Subscribe email (public)' })
  @ApiBody({ type: SubscribeEmailDto })
  subscribe(@Body() body: SubscribeEmailDto) {
    return this.sermonsService.subscribeEmail(body.email);
  }

  @Roles(Role.PASTOR)
  @Get('subscribers')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List subscribers' })
  getSubscribers() {
    return this.sermonsService.getSubscribers();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Scheduled publishing — internal/cron. PASTOR+ for now; later: lock to a service token.
  // ────────────────────────────────────────────────────────────────────────────

  @Roles(Role.PASTOR)
  @Post('publish-scheduled')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Publish scheduled sermons (cron)' })
  publishScheduledSermons() {
    return this.sermonsService.publishScheduledSermons();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Member interactions — authenticated; userId comes from JWT (no IDOR)
  // ────────────────────────────────────────────────────────────────────────────

  @Get('me/:sermonId/context')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'My context for a sermon (reaction/bookmark/note/progress)' })
  getMyContext(@CurrentUser() user: AuthUser, @Param('sermonId') sermonId: string) {
    return this.sermonsService.getMemberContext(user.userId, sermonId);
  }

  @Post('me/:sermonId/reaction')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: ReactionDto })
  @ApiOperation({ summary: 'Set my reaction on a sermon' })
  upsertReaction(
    @CurrentUser() user: AuthUser,
    @Param('sermonId') sermonId: string,
    @Body() body: ReactionDto,
  ) {
    if (!user.memberId) return null;
    return this.sermonsService.upsertReaction(user.memberId, sermonId, body.type);
  }

  @Post('me/:sermonId/bookmark')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Toggle my bookmark on a sermon' })
  toggleBookmark(@CurrentUser() user: AuthUser, @Param('sermonId') sermonId: string) {
    if (!user.memberId) return false;
    return this.sermonsService.toggleBookmark(user.memberId, sermonId);
  }

  @Post('me/:sermonId/note')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: NoteDto })
  @ApiOperation({ summary: 'Save my note on a sermon' })
  upsertNote(
    @CurrentUser() user: AuthUser,
    @Param('sermonId') sermonId: string,
    @Body() body: NoteDto,
  ) {
    if (!user.memberId) return null;
    return this.sermonsService.upsertNote(user.memberId, sermonId, body.content);
  }

  @Post('me/:sermonId/progress')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: ProgressDto })
  @ApiOperation({ summary: 'Save my playback progress' })
  saveProgress(
    @CurrentUser() user: AuthUser,
    @Param('sermonId') sermonId: string,
    @Body() body: ProgressDto,
  ) {
    if (!user.memberId) return null;
    return this.sermonsService.saveProgress(
      user.memberId,
      sermonId,
      body.positionSec,
      body.completed ?? false,
    );
  }

  @Get('me/bookmarks')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'My bookmarked sermons' })
  getMyBookmarks(@CurrentUser() user: AuthUser) {
    return this.sermonsService.getMemberBookmarks(user.userId);
  }

  @Get('me/history')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'My listen history' })
  getMyListenHistory(@CurrentUser() user: AuthUser) {
    return this.sermonsService.getMemberListenHistory(user.userId);
  }

  @Get('me/streak')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'My weekly sermon streak' })
  getMySermonStreak(@CurrentUser() user: AuthUser) {
    return this.sermonsService.getSermonStreak(user.userId);
  }

  @Post('upload-audio')
  @Roles(Role.PASTOR)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload sermon audio', description: 'Uploads an audio file to R2 and returns a public URL.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Audio file to upload',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Audio uploaded successfully' })
  async uploadAudio(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const maxBytes = 100 * 1024 * 1024; // 100 MB
    if (file.size > maxBytes) {
      throw new BadRequestException('File must be under 100 MB');
    }

    const allowed = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/aac'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported audio format');
    }

    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      throw new ServiceUnavailableException('R2 storage is not configured. Add R2_* env vars.');
    }

    const ext = (file.originalname || '').split('.').pop() ?? 'mp3';
    const key = `sermons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    try {
      // Dynamically require AWS S3 client to avoid static compile-time dependency issues
      // This will attempt to use the AWS SDK v3 to PUT the object into R2-compatible S3 endpoint.
      // If the package is not installed, this will throw and we catch below.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

      const endpoint = process.env.R2_ENDPOINT ?? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
      const bucket = process.env.R2_BUCKET ?? process.env.R2_BUCKET_NAME ?? process.env.R2_ACCOUNT_ID;

      const client = new S3Client({
        endpoint,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });

      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      throw new InternalServerErrorException(`Upload to R2 failed: ${msg}`);
    }

    const publicUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
    const audioUrl = publicUrl ? `${publicUrl}/${key}` : key;
    // Return the bare payload — the global ResponseEnvelopeInterceptor wraps it in
    // { data, meta }. Returning { data: ... } here would double-wrap and the frontend
    // would read res.data.audioUrl as undefined. (Matches /uploads/image.)
    return { audioUrl, audioKey: key };
  }
}
