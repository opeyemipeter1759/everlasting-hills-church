import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InboxModule } from '../inbox/inbox.module';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { ArticleReviewService } from './article-review.service';
import { ArticleBlogService } from './article-blog.service';
import { PublicArticlesController } from './public-articles.controller';

@Module({
  // InboxModule, so reviewers hear a piece is waiting and authors hear the verdict.
  imports: [PrismaModule, InboxModule],
  controllers: [PublicArticlesController, ArticlesController],
  providers: [ArticlesService, ArticleReviewService, ArticleBlogService],
})
export class ArticlesModule {}
