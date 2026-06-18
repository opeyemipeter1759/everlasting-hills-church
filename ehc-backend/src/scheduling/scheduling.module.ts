import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulingService } from './scheduling.service';

/**
 * Registers the cron runtime (ScheduleModule.forRoot) and the recurring tasks.
 * MailDispatcher and PrismaService are resolved from their global modules.
 */
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [SchedulingService],
})
export class SchedulingModule {}
