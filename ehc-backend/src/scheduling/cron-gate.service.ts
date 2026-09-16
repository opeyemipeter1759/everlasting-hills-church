import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import type { Env } from '../config/env.validation';

/**
 * Decides whether the in-process @Cron timers run at all.
 *
 * Every @Cron in the codebase (scheduling, push reminders, calendar sync) is
 * registered by ScheduleModule regardless of environment. On Cloud Run that
 * is a trap: with scale-to-zero the container is stopped or CPU-throttled
 * between requests, so the timers fire only on days someone happened to be
 * using the app at 09:30 — which is exactly the patchy history we saw. And a
 * dev machine pointed at the production database fires them a second time.
 *
 * So the default is OFF: Cloud Scheduler drives the jobs through
 * JobsController instead. Set CRON_ENABLED=true only on an always-on host.
 */
@Injectable()
export class CronGateService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CronGateService.name);
  readonly enabled: boolean;

  constructor(
    private readonly registry: SchedulerRegistry,
    config: ConfigService<Env, true>,
  ) {
    this.enabled = config.get('CRON_ENABLED', { infer: true }) === true;
  }

  onApplicationBootstrap() {
    const jobs = this.registry.getCronJobs();
    if (this.enabled) {
      this.logger.log(`In-process cron ENABLED — ${jobs.size} timer(s) running: ${[...jobs.keys()].join(', ')}`);
      return;
    }
    for (const job of jobs.values()) job.stop();
    this.logger.log(
      `In-process cron disabled (CRON_ENABLED is not "true") — ${jobs.size} timer(s) stopped; jobs run via POST /jobs/:name from Cloud Scheduler`,
    );
  }
}
