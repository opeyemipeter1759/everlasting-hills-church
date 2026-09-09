import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role, SermonStatus } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { CreateSermonDto } from '../dto/create-sermon.dto';
import { UpdateSermonDto } from '../dto/update-sermon.dto';
import { SermonAdminReadService } from '../services/sermon-admin-read.service';
import { SermonCreateService } from '../services/sermon-create.service';
import { SermonUpdateService } from '../services/sermon-update.service';
import { SermonAdminActionsService } from '../services/sermon-admin-actions.service';
import { SermonEpisodeService } from '../services/sermon-episode.service';
import { SermonEngagementService } from '../services/sermon-engagement.service';
import { SermonAnalyticsService } from '../services/sermon-analytics.service';
import { SermonsAuthService } from '../services/sermons-auth.service';

/**
 * Sermon CMS. Core management (list, view, create, update, delete) is
 * PASTOR+ OR a plain member of the "Audio Production" unit — see
 * SermonsAuthService. Everything else here (engagement, episodes, featured,
 * analytics) stays PASTOR+ only, enforced by `@Roles` alone.
 * Note: 'admin/overview' is declared before 'admin/:id' so it isn't
 * swallowed by the id param.
 */
@ApiTags('sermons')
@Controller('sermons')
export class SermonsAdminController {
  constructor(
    private readonly read: SermonAdminReadService,
    private readonly create: SermonCreateService,
    private readonly update: SermonUpdateService,
    private readonly adminActions: SermonAdminActionsService,
    private readonly episode: SermonEpisodeService,
    private readonly engagement: SermonEngagementService,
    private readonly analytics: SermonAnalyticsService,
    private readonly sermonsAuth: SermonsAuthService,
  ) {}

  @Roles(Role.MEMBER)
  @Get('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all sermons (PASTOR+ or Audio Production)' })
  @ApiQuery({ name: 'status', required: false, enum: SermonStatus })
  @ApiQuery({ name: 'series', required: false })
  async getAllSermons(
    @CurrentUser() actor: AuthUser,
    @Query('status') status?: SermonStatus,
    @Query('series') series?: string,
  ) {
    await this.sermonsAuth.requireManage(actor);
    return this.read.getAllSermons({ status, series });
  }

  @Roles(Role.MEMBER)
  @Get('admin/overview')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get sermon overview totals (PASTOR+ or Audio Production)' })
  async getAdminOverview(@CurrentUser() actor: AuthUser) {
    await this.sermonsAuth.requireManage(actor);
    return this.adminActions.getAdminSermonOverview();
  }

  @Roles(Role.MEMBER)
  @Get('admin/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get sermon by id (PASTOR+ or Audio Production)' })
  async getSermonById(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    await this.sermonsAuth.requireManage(actor);
    return this.read.getSermonById(id);
  }

  @Roles(Role.PASTOR)
  @Get('admin/:id/engagement')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get full per-member engagement detail for a sermon (admin)' })
  getSermonEngagement(@Param('id') id: string) {
    return this.engagement.getSermonEngagement(id);
  }

  @Roles(Role.PASTOR)
  @Get('admin/:id/episodes/:episodeId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get sermon episode by sermon id (admin)' })
  getEpisodeBySermonId(@Param('id') id: string, @Param('episodeId') episodeId: string) {
    return this.episode.getEpisodeBySermonId(id, episodeId);
  }

  @Roles(Role.MEMBER)
  @Post('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create sermon (PASTOR+ or Audio Production)' })
  @ApiBody({ type: CreateSermonDto })
  @ApiCreatedResponse({ description: 'Sermon created' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async createSermon(@CurrentUser() actor: AuthUser, @Body() body: CreateSermonDto) {
    await this.sermonsAuth.requireManage(actor);
    return this.create.createSermon(body);
  }

  @Roles(Role.MEMBER)
  @Patch('admin/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update sermon (PASTOR+ or Audio Production)' })
  @ApiBody({ type: UpdateSermonDto })
  async updateSermon(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: UpdateSermonDto) {
    await this.sermonsAuth.requireManage(actor);
    return this.update.updateSermon(id, body);
  }

  @Roles(Role.MEMBER)
  @Delete('admin/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete sermon (PASTOR+ or Audio Production)' })
  async deleteSermon(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    await this.sermonsAuth.requireManage(actor);
    return this.adminActions.deleteSermon(id);
  }

  @Roles(Role.PASTOR)
  @Post('admin/:id/featured')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Set featured sermon' })
  setFeatured(@Param('id') id: string) {
    return this.adminActions.setFeaturedSermon(id);
  }

  @Roles(Role.PASTOR)
  @Get('analytics')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get sermon analytics' })
  getAnalytics() {
    return this.analytics.getSermonAnalytics();
  }
}
