import { InternalServerErrorException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsRunnerService } from './jobs-runner.service';
import { CronGateService } from './cron-gate.service';

const SECRET = 'a-very-long-cron-secret-value';

function makeController(secret: string | undefined, runner: Partial<JobsRunnerService> = {}) {
  const config = { get: jest.fn().mockReturnValue(secret) };
  return new JobsController(runner as JobsRunnerService, config as never);
}

describe('JobsController (Cloud Scheduler entry point)', () => {
  it('refuses everything with 503 when CRON_SECRET is not configured', () => {
    const c = makeController(undefined);
    expect(() => c.list(SECRET)).toThrow(ServiceUnavailableException);
  });

  it('rejects a missing or wrong secret with 401', async () => {
    const run = jest.fn();
    const c = makeController(SECRET, { run });
    expect(() => c.list(undefined)).toThrow(UnauthorizedException);
    await expect(c.run('birthday-greetings', 'nope')).rejects.toThrow(UnauthorizedException);
    expect(run).not.toHaveBeenCalled();
  });

  it('runs the named job and returns its result on success', async () => {
    const run = jest.fn().mockResolvedValue({ job: 'birthday-greetings', ok: true, durationMs: 12 });
    const c = makeController(SECRET, { run });
    await expect(c.run('birthday-greetings', SECRET)).resolves.toEqual({ job: 'birthday-greetings', ok: true, durationMs: 12 });
    expect(run).toHaveBeenCalledWith('birthday-greetings');
  });

  it('answers 500 when the job fails so the scheduler retries', async () => {
    const run = jest.fn().mockResolvedValue({ job: 'follow-up-reminders', ok: false, durationMs: 5, error: 'db down' });
    const c = makeController(SECRET, { run });
    await expect(c.run('follow-up-reminders', SECRET)).rejects.toThrow(InternalServerErrorException);
  });
});

describe('JobsRunnerService', () => {
  it('awaits the job and reports a thrown error instead of swallowing it', async () => {
    const scheduling = { sendBirthdayGreetings: jest.fn().mockRejectedValue(new Error('boom')) };
    const runner = new JobsRunnerService(scheduling as never, {} as never, {} as never);
    const result = await runner.run('birthday-greetings');
    expect(result).toMatchObject({ job: 'birthday-greetings', ok: false, error: 'boom' });
  });

  it('404s an unknown job name', async () => {
    const runner = new JobsRunnerService({} as never, {} as never, {} as never);
    await expect(runner.run('not-a-job')).rejects.toThrow(/Unknown job/);
  });
});

describe('CronGateService', () => {
  function makeRegistry() {
    const jobs = new Map([
      ['a', { stop: jest.fn() }],
      ['b', { stop: jest.fn() }],
    ]);
    return { registry: { getCronJobs: () => jobs }, jobs };
  }

  it('stops every in-process timer unless CRON_ENABLED=true', () => {
    const { registry, jobs } = makeRegistry();
    new CronGateService(registry as never, { get: () => undefined } as never).onApplicationBootstrap();
    for (const j of jobs.values()) expect(j.stop).toHaveBeenCalledTimes(1);
  });

  it('leaves the timers running when CRON_ENABLED=true', () => {
    const { registry, jobs } = makeRegistry();
    new CronGateService(registry as never, { get: () => true } as never).onApplicationBootstrap();
    for (const j of jobs.values()) expect(j.stop).not.toHaveBeenCalled();
  });
});
