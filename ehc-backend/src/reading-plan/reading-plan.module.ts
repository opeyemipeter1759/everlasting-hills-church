import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnnouncementsModule } from '../announcements/announcements.module';
import { ReadingPlanController } from './reading-plan.controller';
import { MeReadingPlanController } from './me-reading-plan.controller';
import { ReadingPlanCatalogueService } from './services/reading-plan-catalogue.service';
import { BiblePassageService } from './services/bible-passage.service';
import { MeReadingPlanService } from './services/me-reading-plan.service';
import { PlanProgressRepository } from './services/plan-progress.repository';
import { DailyScriptureController } from './daily-scripture.controller';
import { DailyScriptureService } from './services/daily-scripture.service';
import { AdminReadingController } from './admin-reading.controller';
import { AdminReadingService } from './services/admin-reading.service';
import { ReadingPlanShareController } from './reading-plan-share.controller';
import { ReadingPlanShareService } from './services/reading-plan-share.service';

/**
 * Daily scripture reading.
 *
 * Two controllers on purpose, split by cacheability: plans and passages are
 * immutable and cacheable for a year, a member's own progress is private and
 * never cached.
 */
@Module({
  imports: [PrismaModule, AnnouncementsModule],
  controllers: [
    ReadingPlanController,
    MeReadingPlanController,
    DailyScriptureController,
    AdminReadingController,
    ReadingPlanShareController,
  ],
  providers: [
    ReadingPlanCatalogueService,
    BiblePassageService,
    MeReadingPlanService,
    PlanProgressRepository,
    DailyScriptureService,
    AdminReadingService,
    ReadingPlanShareService,
  ],
  exports: [PlanProgressRepository],
})
export class ReadingPlanModule {}
