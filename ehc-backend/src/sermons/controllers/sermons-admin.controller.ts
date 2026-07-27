import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role, SermonStatus } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateSermonDto } from '../dto/create-sermon.dto';
import { UpdateSermonDto } from '../dto/update-sermon.dto';
import { SermonAdminReadService } from '../services/sermon-admin-read.service';
import { SermonCreateService } from '../services/sermon-create.service';
import { SermonUpdateService } from '../services/sermon-update.service';
import { SermonAdminActionsService } from '../services/sermon-admin-actions.service';
import { SermonEpisodeService } from '../services/sermon-episode.service';
import { SermonEngagementService } from '../services/sermon-engagement.service';
import { SermonAnalyticsService } from '../services/sermon-analytics.service';

/** Sermon CMS — PASTOR+. Note: 'admin/overview' is declared before 'admin/:id' so it isn't swallowed by the id param. */
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
  ) {}

  @Roles(Role.PASTOR)
  @Get('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all sermons (admin)' })
  @ApiQuery({ name: 'status', required: false, enum: SermonStatus })
  @ApiQuery({ name: 'series', required: false })
  getAllSermons(@Query('status') status?: SermonStatus, @Query('series') series?: string) {
    return this.read.getAllSermons({ status, series });
  }

  @Roles(Role.PASTOR)
  @Get('admin/overview')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get sermon overview totals (admin)' })
  getAdminOverview() {
    return this.adminActions.getAdminSermonOverview();
  }

  @Roles(Role.PASTOR)
  @Get('admin/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get sermon by id (admin)' })
  getSermonById(@Param('id') id: string) {
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

  @Roles(Role.PASTOR)
  @Post('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create sermon' })
  @ApiBody({ type: CreateSermonDto })
  @ApiCreatedResponse({ description: 'Sermon created' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  createSermon(@Body() body: CreateSermonDto) {
    return this.create.createSermon(body);
  }

  @Roles(Role.PASTOR)
  @Patch('admin/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update sermon' })
  @ApiBody({ type: UpdateSermonDto })
  updateSermon(@Param('id') id: string, @Body() body: UpdateSermonDto) {
    return this.update.updateSermon(id, body);
  }

  @Roles(Role.PASTOR)
  @Delete('admin/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete sermon' })
  deleteSermon(@Param('id') id: string) {
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
