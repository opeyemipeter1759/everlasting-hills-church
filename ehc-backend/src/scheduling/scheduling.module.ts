import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FollowUpModule } from '../follow-up/follow-up.module';
import { SchedulingService } from './scheduling.service';

/**
 * Registers the cron runtime (ScheduleModule.forRoot) and the recurring tasks.
 * MailDispatcher and PrismaService are resolved from their global modules.
 */
@Module({
  imports: [ScheduleModule.forRoot(), FollowUpModule],
  providers: [SchedulingService],
})
export class SchedulingModule {}
