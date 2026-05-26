import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FormsModule } from './forms/forms.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SermonsModule } from './sermons/sermons.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MembersModule } from './members/members.module';
import { validateEnv } from './config/env.validation';
import type { Env } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: (raw) => validateEnv(raw) }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            ttl: Number(config.get('THROTTLE_TTL_MS')) || 60,
            limit: Number(config.get('THROTTLE_LIMIT')) || 100,
          },
        ],
      }),
    }),

    PrismaModule,
    AuthModule,
    FormsModule,
    AttendanceModule,
    SermonsModule,
    AnalyticsModule,
    MembersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
