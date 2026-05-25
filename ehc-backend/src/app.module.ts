import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FormsModule } from './forms/forms.module';
import { SermonsModule } from './sermons/sermons.module';
import { validateEnv } from './config/env.validation';
import type { Env } from './config/env.validation';

@Module({
  imports: [
    /**
     * Global config with Zod validation. validate() throws at boot if any required env var
     * is missing or malformed — services can then trust ConfigService and never touch
     * process.env directly.
     */
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: (raw) => validateEnv(raw),
    }),

    /**
     * Throttler runs as a global guard (registered below via APP_GUARD).
     * Default: 100 requests / 60s per IP. Tune per-route with @Throttle().
     */
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => [
        {
          ttl: config.get('THROTTLE_TTL_MS', { infer: true }),
          limit: config.get('THROTTLE_LIMIT', { infer: true }),
        },
      ],
    }),

    PrismaModule,
    AuthModule,
    FormsModule,
    SermonsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
