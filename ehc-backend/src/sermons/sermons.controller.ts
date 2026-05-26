import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseInterceptors, UploadedFile, BadRequestException, UnauthorizedException, ServiceUnavailableException, InternalServerErrorException } from '@nestjs/common';
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
import { SermonStatus } from '@prisma/client';
import { CreateSermonDto, SubscribeEmailDto, UpdateSermonDto } from '../dto';
import { SermonsService } from './sermons.service';
import { AuthService } from '../auth/auth.service';

@ApiTags('sermons')
@Controller('sermons')
export class SermonsController {
  constructor(
    private readonly sermonsService: SermonsService,
    private readonly authService: AuthService,
  ) {}

  @Get('admin')
  @ApiOperation({ summary: 'Get all sermons', description: 'Returns all sermons for the current tenant.' })
  @ApiQuery({ name: 'status', required: false, enum: SermonStatus })
  @ApiQuery({ name: 'series', required: false, description: 'Series slug filter' })
  @ApiOkResponse({ description: 'List of sermons' })
  getAllSermons(@Query('status') status?: SermonStatus, @Query('series') series?: string) {
    return this.sermonsService.getAllSermons({ status, series });
  }

  @Get('admin/:id')
  @ApiOperation({ summary: 'Get sermon by id' })
  @ApiOkResponse({ description: 'Single sermon' })
  getSermonById(@Param('id') id: string) {
    return this.sermonsService.getSermonById(id);
  }

  @Post('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create sermon', description: 'Creates a sermon record using a slug generated from the title and date.' })
  @ApiBody({ type: CreateSermonDto })
  @ApiCreatedResponse({ description: 'Sermon created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid sermon payload' })
  createSermon(@Body() body: CreateSermonDto) {
    return this.sermonsService.createSermon(body);
  }

  @Patch('admin/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update sermon' })
  @ApiBody({ type: UpdateSermonDto })
  @ApiOkResponse({ description: 'Sermon updated successfully' })
  updateSermon(@Param('id') id: string, @Body() body: UpdateSermonDto) {
    return this.sermonsService.updateSermon(id, body);
  }

  @Delete('admin/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete sermon' })
  @ApiOkResponse({ description: 'Sermon deleted successfully' })
  deleteSermon(@Param('id') id: string) {
    return this.sermonsService.deleteSermon(id);
  }

  @Post('admin/:id/featured')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Set featured sermon' })
  @ApiOkResponse({ description: 'Featured sermon updated successfully' })
  setFeatured(@Param('id') id: string) {
    return this.sermonsService.setFeaturedSermon(id);
  }

  @Get('published')
  @ApiOperation({ summary: 'Get published sermons' })
  @ApiQuery({ name: 'series', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Published sermons list' })
  getPublishedSermons(@Query('series') series?: string, @Query('search') search?: string, @Query('limit') limit?: string) {
    return this.sermonsService.getPublishedSermons({
      series,
      search,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get sermon by slug' })
  @ApiOkResponse({ description: 'Sermon detail' })
  getSermonBySlug(@Param('slug') slug: string) {
    return this.sermonsService.getSermonBySlug(slug);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured sermon' })
  @ApiOkResponse({ description: 'Featured sermon' })
  getFeaturedSermon() {
    return this.sermonsService.getFeaturedSermon();
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest sermons' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Latest sermons' })
  getLatestSermons(@Query('limit') limit?: string) {
    return this.sermonsService.getLatestSermons(limit ? Number(limit) : 3);
  }

  @Get('series')
  @ApiOperation({ summary: 'Get sermon series list' })
  @ApiOkResponse({ description: 'Published sermon series' })
  getSeriesList() {
    return this.sermonsService.getSeriesList();
  }

  @Post(':id/play')
  @ApiOperation({ summary: 'Increment play count' })
  @ApiOkResponse({ description: 'Play count updated' })
  incrementPlayCount(@Param('id') id: string) {
    return this.sermonsService.incrementPlayCount(id);
  }

  @Get('analytics')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get sermon analytics' })
  @ApiOkResponse({ description: 'Sermon analytics' })
  getAnalytics() {
    return this.sermonsService.getSermonAnalytics();
  }

  @Post('subscribers')
  @ApiOperation({ summary: 'Subscribe email' })
  @ApiBody({ type: SubscribeEmailDto })
  @ApiCreatedResponse({ description: 'Subscribed successfully' })
  subscribe(@Body() body: SubscribeEmailDto) {
    const { email } = body;
    return this.sermonsService.subscribeEmail(email);
  }

  @Get('subscribers')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get subscribers' })
  @ApiOkResponse({ description: 'Subscriber list' })
  getSubscribers() {
    return this.sermonsService.getSubscribers();
  }

  @Post('publish-scheduled')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Publish scheduled sermons' })
  @ApiOkResponse({ description: 'Scheduled sermons published' })
  publishScheduledSermons() {
    return this.sermonsService.publishScheduledSermons();
  }

  @Get('member/:userId/:sermonId/context')
  @ApiOperation({ summary: 'Get member sermon context' })
  @ApiOkResponse({ description: 'Member context' })
  getMemberContext(@Param('userId') userId: string, @Param('sermonId') sermonId: string) {
    return this.sermonsService.getMemberContext(userId, sermonId);
  }

  @Post('member/:memberId/:sermonId/reaction')
  @ApiOperation({ summary: 'Set sermon reaction' })
  @ApiBody({ schema: { example: { type: 'LIKE' } } })
  @ApiOkResponse({ description: 'Reaction updated' })
  upsertReaction(
    @Param('memberId') memberId: string,
    @Param('sermonId') sermonId: string,
    @Body('type') type: string,
  ) {
    return this.sermonsService.upsertReaction(memberId, sermonId, type);
  }

  @Post('member/:memberId/:sermonId/bookmark')
  @ApiOperation({ summary: 'Toggle sermon bookmark' })
  @ApiOkResponse({ description: 'Bookmark toggled' })
  toggleBookmark(@Param('memberId') memberId: string, @Param('sermonId') sermonId: string) {
    return this.sermonsService.toggleBookmark(memberId, sermonId);
  }

  @Post('member/:memberId/:sermonId/note')
  @ApiOperation({ summary: 'Save sermon note' })
  @ApiBody({ schema: { example: { content: 'My sermon note' } } })
  @ApiOkResponse({ description: 'Note saved' })
  upsertNote(
    @Param('memberId') memberId: string,
    @Param('sermonId') sermonId: string,
    @Body('content') content: string,
  ) {
    return this.sermonsService.upsertNote(memberId, sermonId, content);
  }

  @Post('member/:memberId/:sermonId/progress')
  @ApiOperation({ summary: 'Save sermon progress' })
  @ApiBody({ schema: { example: { positionSec: 120, completed: false } } })
  @ApiOkResponse({ description: 'Progress saved' })
  saveProgress(
    @Param('memberId') memberId: string,
    @Param('sermonId') sermonId: string,
    @Body('positionSec') positionSec: number,
    @Body('completed') completed?: boolean,
  ) {
    return this.sermonsService.saveProgress(memberId, sermonId, Number(positionSec), completed ?? false);
  }

  @Get('member/:userId/bookmarks')
  @ApiOperation({ summary: 'Get member bookmarks' })
  @ApiOkResponse({ description: 'Bookmark list' })
  getMemberBookmarks(@Param('userId') userId: string) {
    return this.sermonsService.getMemberBookmarks(userId);
  }

  @Get('member/:userId/history')
  @ApiOperation({ summary: 'Get member listen history' })
  @ApiOkResponse({ description: 'Listen history' })
  getMemberListenHistory(@Param('userId') userId: string) {
    return this.sermonsService.getMemberListenHistory(userId);
  }

  @Get('member/:userId/streak')
  @ApiOperation({ summary: 'Get sermon streak' })
  @ApiOkResponse({ description: 'Streak value' })
  getSermonStreak(@Param('userId') userId: string) {
    return this.sermonsService.getSermonStreak(userId);
  }

  @Post('upload-audio')
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
  async uploadAudio(@Req() request: { headers?: { authorization?: string } }, @UploadedFile() file: any) {
    const authorization = request.headers?.authorization;
    await this.authService.getProfile(authorization);

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
    return { data: { audioUrl, audioKey: key } };
  }
}
