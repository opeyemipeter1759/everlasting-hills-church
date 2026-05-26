import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Nest-managed Prisma client. Injected anywhere via the global PrismaModule.
 *
 * Fail-fast: if the database is unreachable at boot, we throw and let the process exit.
 * The previous behavior swallowed the error and let the app come up "healthy" while every
 * request failed at query time — that's the worst possible failure mode. Process supervisors
 * (PM2, Docker, K8s) will restart on crash and alert on repeated restart loops.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  declare $connect: () => Promise<void>;
  declare $disconnect: () => Promise<void>;

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Database connection failed at boot', error as Error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
