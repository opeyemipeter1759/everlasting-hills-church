import {
  BadRequestException,
  Body,
  Controller,
  UploadedFile,
  UseInterceptors,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { hasValidFileSignature } from '../uploads/file-signature.util';
import { UploadsService } from '../uploads/uploads.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { ArticlesService } from './articles.service';
import {
  ArticleCommentDto,
  CreateArticleDto,
  RequestChangesDto,
  ReviewArticleDto,
  UpdateArticleDto,
} from './dto/article.dto';
import { ArticleReviewService } from './article-review.service';
import { ArticleBlogService } from './article-blog.service';

/**
 * Member written articles: what people are learning, published to the church.
 *
 * Every route is member level, because anyone can write. Publishing goes
 * through review by the content department's head, or a pastor or admin. The
 * review routes check that themselves, since a reviewer is not a fixed role.
 */
@ApiTags('articles')
@Controller('articles')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class ArticlesController {
  constructor(
    private readonly articles: ArticlesService,
    private readonly review: ArticleReviewService,
    private readonly blog: ArticleBlogService,
    private readonly uploads: UploadsService,
  ) {}

  /** A cover picture for an article, uploaded before the article is saved. */
  @Post('cover')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload an article cover picture (JPG, PNG or WebP, up to 5 MB); returns its URL' })
  async cover(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (file.size > 5 * 1024 * 1024) throw new BadRequestException('Choose a picture under 5 MB');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      throw new BadRequestException('Choose a JPG, PNG or WebP picture');
    }
    if (!hasValidFileSignature(file)) throw new BadRequestException('That picture does not match its declared format');
    return this.uploads.uploadObject(file, 'article-covers');
  }

  // Declared before :slug routes, which would otherwise take "manage" as a slug.
  @Get('manage/list')
  @ApiOperation({ summary: 'Every article in every state, for pastors and admins to manage' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false })
  manageList(
    @CurrentUser() actor: AuthUser,
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
  ) {
    return this.blog.adminList(actor, { status, q, page: Number(page) || 1 });
  }

  @Get('manage/comments')
  @ApiOperation({ summary: 'The newest comments on articles, for pastors and admins to moderate' })
  manageComments(@CurrentUser() actor: AuthUser) {
    return this.blog.recentComments(actor);
  }

  @Delete('comments/:commentId')
  @ApiOperation({ summary: "Remove a comment: its writer, the article's author, or a pastor or admin" })
  deleteComment(@CurrentUser() actor: AuthUser, @Param('commentId') commentId: string) {
    return this.blog.deleteComment(commentId, actor);
  }

  @Get(':slug/comments')
  @ApiOperation({ summary: 'Comments on a published article, with which ones I may remove' })
  @ApiQuery({ name: 'page', required: false })
  comments(@CurrentUser() actor: AuthUser, @Param('slug') slug: string, @Query('page') page?: string) {
    return this.blog.comments(slug, Number(page) || 1, actor);
  }

  @Post(':slug/comments')
  @ApiOperation({ summary: 'Comment on a published article as a member' })
  comment(@CurrentUser() actor: AuthUser, @Param('slug') slug: string, @Body() body: ArticleCommentDto) {
    return this.blog.comment(slug, { body: body.body }, actor);
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'The church feed: published articles, featured first',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'authorId', required: false })
  @ApiQuery({ name: 'q', required: false, description: 'Search titles, subtitles and passages' })
  @ApiQuery({ name: 'tab', required: false, enum: ['for-you', 'featured', 'saved'] })
  feed(
    @CurrentUser() actor: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('authorId') authorId?: string,
    @Query('q') q?: string,
    @Query('tab') tab?: string,
  ) {
    return this.articles.feed(actor, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      authorId,
      q,
      tab,
    });
  }

  @Get('mine')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Everything the caller has written, drafts included',
  })
  mine(@CurrentUser() actor: AuthUser) {
    return this.articles.mine(actor);
  }

  // Declared before :slug, which would otherwise take "review" as a slug.
  @Get('review')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary:
      'Articles waiting for review (content department head, pastors, admins)',
  })
  reviewQueue(@CurrentUser() actor: AuthUser) {
    return this.review.queue(actor);
  }

  @Get('review/access')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Whether the caller reviews articles, and how many are waiting',
  })
  reviewAccess(@CurrentUser() actor: AuthUser) {
    return this.review.access(actor);
  }

  @Get(':slug')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'One article. A draft is visible to its author alone.',
  })
  bySlug(@CurrentUser() actor: AuthUser, @Param('slug') slug: string) {
    return this.articles.bySlug(actor, slug);
  }

  @Post()
  @ApiOperation({
    summary: 'Write an article as a draft or submit it for approval',
  })
  create(@CurrentUser() actor: AuthUser, @Body() body: CreateArticleDto) {
    return this.articles.create(actor, body);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      "Edit your own article, or archive somebody else's if you are a pastor or admin. Publication requires approval by another reviewer.",
  })
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateArticleDto,
  ) {
    return this.articles.update(actor, id, body);
  }

  @Post(':id/bookmark')
  @ApiOperation({ summary: 'Save a published article to read later' })
  bookmark(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.articles.setBookmark(actor, id, true);
  }

  @Delete(':id/bookmark')
  @ApiOperation({ summary: 'Take an article off my saved list' })
  unbookmark(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.articles.setBookmark(actor, id, false);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an article: its author, or a pastor or admin' })
  remove(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.articles.remove(actor, id);
  }

  @Post(':id/feature')
  @Roles(Role.PASTOR)
  @ApiOperation({
    summary: 'Lift an article to the top of the church feed (PASTOR+)',
  })
  feature(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.articles.setFeatured(actor, id, true);
  }

  @Delete(':id/feature')
  @Roles(Role.PASTOR)
  @ApiOperation({
    summary: 'Remove an article from the featured slot (PASTOR+)',
  })
  unfeature(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.articles.setFeatured(actor, id, false);
  }

  @Post(':id/approve')
  @ApiOperation({
    summary: 'Approve a piece waiting for review, which publishes it',
  })
  approve(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: ReviewArticleDto,
  ) {
    return this.review.approve(actor, id, body.revision, body.note);
  }

  @Post(':id/request-changes')
  @ApiOperation({ summary: 'Send a piece back to its author with a note' })
  requestChanges(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: RequestChangesDto,
  ) {
    return this.review.requestChanges(actor, id, body.revision, body.note);
  }

  @Post(':id/like')
  @ApiOperation({
    summary: 'Like an article. Idempotent: a double tap counts once.',
  })
  like(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.articles.setLike(actor, id, true);
  }

  @Delete(':id/like')
  @ApiOperation({ summary: 'Remove your like' })
  unlike(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.articles.setLike(actor, id, false);
  }
}
