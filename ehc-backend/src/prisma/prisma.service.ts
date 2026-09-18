import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** Prisma's default connect_timeout is 5s; the Supabase pooler can take ~12s on a cold connect. */
const DEFAULT_CONNECT_TIMEOUT_S = 30;
const CONNECT_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2_000;

/**
 * Give the datasource URL a generous connect_timeout unless one is set explicitly.
 * Returns undefined (use schema.prisma's env var as-is) when there's nothing to change.
 */
function datasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.searchParams.has('connect_timeout')) return undefined;
    url.searchParams.set('connect_timeout', String(DEFAULT_CONNECT_TIMEOUT_S));
    return url.toString();
  } catch {
    return undefined;
  }
}

/**
 * Nest-managed Prisma client. Injected anywhere via the global PrismaModule.
 *
 * Fail-fast: if the database is unreachable at boot, we throw and let the process exit.
 * The previous behavior swallowed the error and let the app come up "healthy" while every
 * request failed at query time — that's the worst possible failure mode. Process supervisors
 * (PM2, Docker, K8s) will restart on crash and alert on repeated restart loops.
 *
 * A slow first connect (pooler cold start) is retried a few times before giving up.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  declare $connect: () => Promise<void>;
  declare $disconnect: () => Promise<void>;

  constructor() {
    const url = datasourceUrl();
    super(url ? { datasources: { db: { url } } } : undefined);
  }

  async onModuleInit(): Promise<void> {
    for (let attempt = 1; ; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Database connection established');
        return;
      } catch (error) {
        if (attempt >= CONNECT_ATTEMPTS) {
          this.logger.error('Database connection failed at boot', error as Error);
          throw error;
        }
        this.logger.warn(
          `Database connection attempt ${attempt}/${CONNECT_ATTEMPTS} failed: ${(error as Error).message.split('\n')[0]} — retrying`,
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
