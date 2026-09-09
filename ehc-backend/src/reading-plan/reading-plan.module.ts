import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReadingPlanController } from './reading-plan.controller';
import { MeReadingPlanController } from './me-reading-plan.controller';
import { ReadingPlanCatalogueService } from './services/reading-plan-catalogue.service';
import { BiblePassageService } from './services/bible-passage.service';
import { MeReadingPlanService } from './services/me-reading-plan.service';
import { PlanProgressRepository } from './services/plan-progress.repository';

/**
 * Daily scripture reading.
 *
 * Two controllers on purpose, split by cacheability: plans and passages are
 * immutable and cacheable for a year, a member's own progress is private and
 * never cached.
 */
@Module({
  imports: [PrismaModule],
  controllers: [ReadingPlanController, MeReadingPlanController],
  providers: [
    ReadingPlanCatalogueService,
    BiblePassageService,
    MeReadingPlanService,
    PlanProgressRepository,
  ],
  exports: [PlanProgressRepository],
})
export class ReadingPlanModule {}
