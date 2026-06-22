import { Global, Logger, Module, type DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { Redis } from 'ioredis';
import type { Env } from '../config/env.validation';
import { EMAIL_QUEUE, isRedisConfigured } from './jobs.constants';
import {
  MailDispatcher,
  QueueMailDispatcher,
  EventMailDispatcher,
} from './mail-dispatcher';
import { EmailProcessor } from './email.processor';

/**
 * Background-job infrastructure.
 *
 * forRoot() inspects REDIS_URL once at startup and wires one of two worlds:
 *
 *   Redis present → BullMQ root + email queue + worker, durable retrying jobs.
 *   Redis absent  → no Redis connection at all; MailDispatcher falls back to the
 *                   in-process EventEmitter so local dev needs zero extra infra.
 *
 * @Global so any feature module can inject MailDispatcher without importing this.
 */
@Global()
@Module({})
export class JobsModule {
  static forRoot(): DynamicModule {
    const logger = new Logger(JobsModule.name);

    if (!isRedisConfigured()) {
      logger.log('REDIS_URL not set — using in-process email dispatch (no queue)');
      return {
        module: JobsModule,
        providers: [{ provide: MailDispatcher, useClass: EventMailDispatcher }],
        exports: [MailDispatcher],
      };
    }

    logger.log('REDIS_URL detected — background job queue enabled (BullMQ)');
    return {
      module: JobsModule,
      imports: [
        BullModule.forRootAsync({
          inject: [ConfigService],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          useFactory: (config: ConfigService<Env, true>): any => ({
            // BullMQ workers require maxRetriesPerRequest: null on the connection.
            connection: new Redis(config.get('REDIS_URL', { infer: true })!, {
              maxRetriesPerRequest: null,
            }),
          }),
        }),
        BullModule.registerQueue({ name: EMAIL_QUEUE }),
      ],
      providers: [
        EmailProcessor,
        { provide: MailDispatcher, useClass: QueueMailDispatcher },
      ],
      exports: [MailDispatcher],
    };
  }
}
