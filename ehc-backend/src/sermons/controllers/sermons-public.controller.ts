import { Controller, Get, Header, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { RecentSermonsQueryDto, SermonFeedQueryDto } from '../dto/sermon-read.query.dto';
import { SermonPublicReadService } from '../services/sermon-public-read.service';
import { SermonEpisodeService } from '../services/sermon-episode.service';
import { SermonReadService } from '../recent/sermon-read.service';
import { TenantId } from '../recent/tenant-id.decorator';

/** Public (unauthenticated) sermon reads. */
@ApiTags('sermons')
@Controller('sermons')
export class SermonsPublicController {
  constructor(
    private readonly publicRead: SermonPublicReadService,
    private readonly episode: SermonEpisodeService,
    private readonly sermonReadService: SermonReadService,
  ) {}

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
    return this.publicRead.getPublishedSermons({ series, search, limit: limit ? Number(limit) : undefined });
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get sermon by slug (public)' })
  getSermonBySlug(@Param('slug') slug: string) {
    return this.publicRead.getSermonBySlug(slug);
  }

  @Public()
  @Get('slug/:slug/episodes/:episodeId')
  @ApiOperation({ summary: 'Get sermon episode by sermon slug (public)' })
  getEpisodeBySlug(@Param('slug') slug: string, @Param('episodeId') episodeId: string) {
    return this.episode.getEpisodeBySlug(slug, episodeId);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured sermon (public)' })
  getFeaturedSermon() {
    return this.publicRead.getFeaturedSermon();
  }

  @Public()
  @Get('latest')
  @ApiOperation({ summary: 'Get latest sermons (public)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLatestSermons(@Query('limit') limit?: string) {
    return this.publicRead.getLatestSermons(limit ? Number(limit) : 3);
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
    return this.publicRead.getSeriesList();
  }

  /**
   * Public play-count increment. Throttled tightly because it's an unauthenticated
   * mutation — without this an attacker could spam-inflate any sermon's count.
   */
  @Public()
  @Post(':id/play')
  @ApiOperation({ summary: 'Increment play count (public)' })
  incrementPlayCount(@Param('id') id: string) {
    return this.episode.incrementPlayCount(id);
  }
}
