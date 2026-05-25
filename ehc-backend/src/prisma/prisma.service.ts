import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Nest-managed Prisma client. Injected anywhere via the global PrismaModule.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  declare $connect: () => Promise<void>;
  declare $disconnect: () => Promise<void>;
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.log('Continuing without database connection...', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
