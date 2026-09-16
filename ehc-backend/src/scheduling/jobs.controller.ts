import {
  Controller,
  Get,
  Headers,
  HttpCode,
  InternalServerErrorException,
  Param,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { timingSafeEqual } from 'crypto';
import { Public } from '../auth/decorators/public.decorator';
import { JOB_NAMES, JobsRunnerService } from './jobs-runner.service';
import type { Env } from '../config/env.validation';

/**
 * External trigger for the scheduled jobs — the endpoint Cloud Scheduler calls.
 *
 * Not a user route: no JWT (Scheduler has none) but a shared secret in the
 * `X-Cron-Secret` header, compared in constant time. With CRON_SECRET unset
 * the endpoint refuses everything with 503 so it can never be left open by
 * accident. A failed job answers 500 so the scheduler's retry policy kicks in.
 */
@ApiExcludeController()
@Controller('jobs')
export class JobsController {
  private readonly secret: Buffer | null;

  constructor(
    private readonly runner: JobsRunnerService,
    config: ConfigService<Env, true>,
  ) {
    const raw = config.get('CRON_SECRET', { infer: true });
    this.secret = raw ? Buffer.from(raw) : null;
  }

  private authorize(header: string | undefined) {
    if (!this.secret) {
      throw new ServiceUnavailableException('Scheduled jobs are switched off — CRON_SECRET is not set on this server.');
    }
    const given = Buffer.from(header ?? '');
    if (given.length !== this.secret.length || !timingSafeEqual(given, this.secret)) {
      throw new UnauthorizedException('Invalid or missing X-Cron-Secret');
    }
  }

  /** Lets an operator confirm the secret and see which names are valid. */
  @Public()
  @Get()
  list(@Headers('x-cron-secret') secret?: string) {
    this.authorize(secret);
    return { jobs: JOB_NAMES };
  }

  @Public()
  @Post(':name')
  @HttpCode(200)
  async run(@Param('name') name: string, @Headers('x-cron-secret') secret?: string) {
    this.authorize(secret);
    const result = await this.runner.run(name);
    if (!result.ok) {
      // 500 rather than a 200-with-ok:false so Cloud Scheduler counts it as a
      // failure and retries per its policy.
      throw new JobFailedException(result);
    }
    return result;
  }
}

/** 500 carrying the job result, so the scheduler log shows what broke. */
class JobFailedException extends InternalServerErrorException {
  constructor(result: { job: string; error?: string; durationMs: number }) {
    super({ message: `Job "${result.job}" failed: ${result.error ?? 'unknown error'}`, ...result });
  }
}
