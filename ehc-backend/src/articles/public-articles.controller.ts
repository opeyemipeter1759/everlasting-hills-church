import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { ArticleBlogService } from './article-blog.service';
import { PublicArticleCommentDto } from './dto/article.dto';

/**
 * The public blog on the church website: published member articles anyone can
 * read and share, and comment on with a name. No sign-in.
 */
@ApiTags('articles')
@Controller('public/articles')
export class PublicArticlesController {
  private readonly logger = new Logger(PublicArticlesController.name);

  constructor(private readonly blog: ArticleBlogService) {}

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get()
  @ApiOperation({ summary: 'Published articles for the public blog, featured first, newest next' })
  @ApiQuery({ name: 'page', required: false })
  list(@Query('page') page?: string) {
    return this.blog.list(Number(page) || 1);
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get(':slug')
  @ApiOperation({ summary: 'One published article, for the public blog' })
  read(@Param('slug') slug: string) {
    return this.blog.read(slug);
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get(':slug/comments')
  @ApiOperation({ summary: 'Comments on a published article, newest first' })
  @ApiQuery({ name: 'page', required: false })
  comments(@Param('slug') slug: string, @Query('page') page?: string) {
    return this.blog.comments(slug, Number(page) || 1);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post(':slug/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Comment on a published article as a visitor, with a name' })
  async comment(@Param('slug') slug: string, @Body() body: PublicArticleCommentDto) {
    // Bots fill in every field; people never see this one. Look successful, keep nothing.
    if (body.website) {
      this.logger.warn({ msg: 'article comment honeypot tripped' });
      return { id: null, authorName: body.name, body: body.body, createdAt: new Date() };
    }
    return this.blog.comment(slug, { name: body.name, body: body.body }, null);
  }
}
