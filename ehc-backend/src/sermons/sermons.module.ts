import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { InboxModule } from '../inbox/inbox.module';
import { SermonReadService } from './recent/sermon-read.service';
import { SERMON_REPOSITORY } from './recent/sermon-repository';
import { PrismaSermonRepository } from './recent/prisma-sermon.repository';
import { InMemorySermonRepository } from './recent/in-memory-sermon.repository';

import { SermonsAdminController } from './controllers/sermons-admin.controller';
import { SermonsPublicController } from './controllers/sermons-public.controller';
import { SermonsCommentsController } from './controllers/sermons-comments.controller';
import { SermonsSubscribersController } from './controllers/sermons-subscribers.controller';
import { SermonsInteractionsController } from './controllers/sermons-interactions.controller';
import { SermonsDirectMessageController } from './controllers/sermons-direct-message.controller';
import { SermonsMemberStatsController } from './controllers/sermons-member-stats.controller';
import { SermonsUploadController } from './controllers/sermons-upload.controller';

import { SermonMemberLookupService } from './services/sermon-member-lookup.service';
import { SermonAdminReadService } from './services/sermon-admin-read.service';
import { SermonCreateService } from './services/sermon-create.service';
import { SermonUpdateService } from './services/sermon-update.service';
import { SermonAdminActionsService } from './services/sermon-admin-actions.service';
import { SermonPublicReadService } from './services/sermon-public-read.service';
import { SermonEpisodeService } from './services/sermon-episode.service';
import { SermonAnalyticsService } from './services/sermon-analytics.service';
import { SermonEngagementService } from './services/sermon-engagement.service';
import { SermonSubscribersService } from './services/sermon-subscribers.service';
import { SermonInteractionsService } from './services/sermon-interactions.service';
import { SermonCommentsService } from './services/sermon-comments.service';
import { SermonDirectMessageService } from './services/sermon-direct-message.service';
import { SermonMemberStatsService } from './services/sermon-member-stats.service';

@Module({
  imports: [PrismaModule, AuthModule, InboxModule],
  controllers: [
    SermonsAdminController,
    // SermonsPublicController owns 'slug/:slug' (2 segments); SermonsCommentsController owns
    // ':sermonId/comments' (also 2 segments). Both must resolve for their real routes, so
    // Public is registered first, preserving the original single-controller declaration order.
    SermonsPublicController,
    SermonsCommentsController,
    SermonsSubscribersController,
    SermonsInteractionsController,
    SermonsDirectMessageController,
    SermonsMemberStatsController,
    SermonsUploadController,
  ],
  providers: [
    SermonReadService,
    // The seam: swap this binding (e.g. to InMemorySermonRepository for tests/local)
    // without touching the controller or read service.
    PrismaSermonRepository,
    InMemorySermonRepository,
    { provide: SERMON_REPOSITORY, useClass: PrismaSermonRepository },

    SermonMemberLookupService,
    SermonAdminReadService,
    SermonCreateService,
    SermonUpdateService,
    SermonAdminActionsService,
    SermonPublicReadService,
    SermonEpisodeService,
    SermonAnalyticsService,
    SermonEngagementService,
    SermonSubscribersService,
    SermonInteractionsService,
    SermonCommentsService,
    SermonDirectMessageService,
    SermonMemberStatsService,
  ],
})
export class SermonsModule {}
