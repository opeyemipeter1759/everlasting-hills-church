import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FollowUpModule } from '../follow-up/follow-up.module';
import { CalendarModule } from '../calendar/calendar.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { SermonDigestModule } from '../sermon-digest/sermon-digest.module';
import { SchedulingService } from './scheduling.service';
import { CronGateService } from './cron-gate.service';
import { JobsRunnerService } from './jobs-runner.service';
import { JobsController } from './jobs.controller';

/**
 * Registers the cron runtime (ScheduleModule.forRoot) and the recurring tasks,
 * plus the two pieces that make them work on Cloud Run: CronGateService turns
 * the in-process timers off unless CRON_ENABLED=true, and JobsController lets
 * Cloud Scheduler run each job on demand (POST /jobs/:name + X-Cron-Secret).
 * PushModule is @Global, so PushTriggersService resolves without an import.
 * MailDispatcher and PrismaService are resolved from their global modules.
 */
@Module({
  imports: [ScheduleModule.forRoot(), FollowUpModule, CalendarModule, AttendanceModule, SermonDigestModule],
  controllers: [JobsController],
  providers: [SchedulingService, CronGateService, JobsRunnerService],
})
export class SchedulingModule {}
