import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
  CreateArticleDto,
  RequestChangesDto,
  ReviewArticleDto,
  UpdateArticleDto,
} from './dto/article.dto';
import { ArticleReviewService } from './article-review.service';

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
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'The church feed: published articles, featured first',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'authorId', required: false })
  feed(
    @CurrentUser() actor: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('authorId') authorId?: string,
  ) {
    return this.articles.feed(actor, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      authorId,
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete your own article' })
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
