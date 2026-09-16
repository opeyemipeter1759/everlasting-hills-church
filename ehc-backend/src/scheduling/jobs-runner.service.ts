import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { PushTriggersService } from '../push/services/push-triggers.service';
import { GoogleCalendarSyncService } from '../calendar/services/google-calendar-sync.service';

/** Names match the @Cron({ name }) options so logs and Cloud Scheduler agree. */
export const JOB_NAMES = [
  'birthday-greetings',
  'anniversary-greetings',
  'follow-up-auto-surface',
  'follow-up-reminders',
  'weekly-digest',
  'google-calendar-sync',
  'push-service-reminder',
  'push-serving-reminder',
  'push-prayer-meeting',
] as const;
export type JobName = (typeof JOB_NAMES)[number];

export interface JobRunResult {
  job: JobName;
  ok: boolean;
  durationMs: number;
  error?: string;
}

/**
 * Runs one scheduled job on demand, by name, and awaits it. This is what
 * Cloud Scheduler hits (via JobsController); the same methods are what the
 * in-process @Cron timers call when CRON_ENABLED=true, so there is exactly one
 * implementation of each job. Errors are awaited and reported rather than
 * swallowed — cron's fireOnTick() drops them unless waitForCompletion is set,
 * and a scheduler needs a real status code to retry on.
 */
@Injectable()
export class JobsRunnerService {
  private readonly logger = new Logger(JobsRunnerService.name);

  constructor(
    private readonly scheduling: SchedulingService,
    private readonly pushTriggers: PushTriggersService,
    private readonly calendarSync: GoogleCalendarSyncService,
  ) {}

  isJob(name: string): name is JobName {
    return (JOB_NAMES as readonly string[]).includes(name);
  }

  async run(name: string): Promise<JobRunResult> {
    if (!this.isJob(name)) {
      throw new NotFoundException(`Unknown job "${name}". Known jobs: ${JOB_NAMES.join(', ')}`);
    }
    const started = Date.now();
    this.logger.log(`job ${name}: started (external trigger)`);
    try {
      await this.dispatch(name);
      const durationMs = Date.now() - started;
      this.logger.log(`job ${name}: finished in ${durationMs}ms`);
      return { job: name, ok: true, durationMs };
    } catch (err) {
      const durationMs = Date.now() - started;
      const error = err instanceof Error ? err.message : String(err);
      this.logger.error(`job ${name}: FAILED after ${durationMs}ms — ${error}`);
      return { job: name, ok: false, durationMs, error };
    }
  }

  private dispatch(name: JobName): Promise<void> {
    switch (name) {
      case 'birthday-greetings':
        return this.scheduling.sendBirthdayGreetings();
      case 'anniversary-greetings':
        return this.scheduling.sendAnniversaryGreetings();
      case 'follow-up-auto-surface':
        return this.scheduling.autoSurfaceFollowUps();
      case 'follow-up-reminders':
        return this.scheduling.sweepFollowUpReminders();
      case 'weekly-digest':
        return this.scheduling.sendWeeklyDigest();
      case 'google-calendar-sync':
        return this.calendarSync.scheduledSync();
      case 'push-service-reminder':
        return this.pushTriggers.serviceReminders();
      case 'push-serving-reminder':
        return this.pushTriggers.servingReminders();
      case 'push-prayer-meeting':
        return this.pushTriggers.prayerMeetingReminders();
    }
  }
}
