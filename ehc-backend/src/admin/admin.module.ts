import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HeadcountModule } from '../headcount/headcount.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { MembersModule } from '../members/members.module';
import { FollowUpModule } from '../follow-up/follow-up.module';
import { EventsModule } from '../events/events.module';
import { CmsModule } from '../cms/cms.module';
import { AdminHomeService } from './admin-home.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule, HeadcountModule, AnalyticsModule, MembersModule, FollowUpModule, EventsModule, CmsModule],
  controllers: [AdminController],
  providers: [AdminService, AdminHomeService],
})
export class AdminModule {}
