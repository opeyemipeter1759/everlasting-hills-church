import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
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
import { SermonsService } from './sermons.service';

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
  constructor(private readonly sermonsService: SermonsService) {}

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
  @Get('admin/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get sermon by id (admin)' })
  getSermonById(@Param('id') id: string) {
    return this.sermonsService.getSermonById(id);
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

  @Get('me/sermons/:sermonId/context')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'My context for a sermon (reaction/bookmark/note/progress)' })
  getMyContext(@CurrentUser() user: AuthUser, @Param('sermonId') sermonId: string) {
    return this.sermonsService.getMemberContext(user.userId, sermonId);
  }

  @Post('me/sermons/:sermonId/reaction')
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

  @Post('me/sermons/:sermonId/bookmark')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Toggle my bookmark on a sermon' })
  toggleBookmark(@CurrentUser() user: AuthUser, @Param('sermonId') sermonId: string) {
    if (!user.memberId) return false;
    return this.sermonsService.toggleBookmark(user.memberId, sermonId);
  }

  @Post('me/sermons/:sermonId/note')
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

  @Post('me/sermons/:sermonId/progress')
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
}
