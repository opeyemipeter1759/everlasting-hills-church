import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InboxModule } from '../inbox/inbox.module';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { ArticleReviewService } from './article-review.service';

@Module({
  // InboxModule, so reviewers hear a piece is waiting and authors hear the verdict.
  imports: [PrismaModule, InboxModule],
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticleReviewService],
})
export class ArticlesModule {}
