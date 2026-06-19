import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FormsModule } from './forms/forms.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SermonsModule } from './sermons/sermons.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MembersModule } from './members/members.module';
import { VisitorsModule } from './visitors/visitors.module';
import { UnitsModule } from './units/units.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { UsersModule } from './users/users.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { UploadsModule } from './uploads/uploads.module';
import { EventsModule } from './events/events.module';
import { OverviewModule } from './overview/overview.module';
import { validateEnv } from './config/env.validation';
import type { Env } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: (raw) => validateEnv(raw) }),

    /**
     * Structured JSON logging via pino. In dev we pipe through pino-pretty for human-readable
     * output; in prod we emit raw JSON for log aggregators (Datadog, CloudWatch, etc.) to parse.
     *
     * autoLogging adds an HTTP-request log line per request with method, url, status, latency —
     * eliminates the need for a separate request-logging middleware.
     */
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            level: isProd ? 'info' : 'debug',
            transport: isProd
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'HH:MM:ss.l',
                    ignore: 'pid,hostname,req,res,responseTime',
                    messageFormat: '{context} {msg}',
                  },
                },
            // Don't log the full request body — leaks secrets. Just the essentials.
            serializers: {
              req: (req) => ({ method: req.method, url: req.url }),
              res: (res) => ({ statusCode: res.statusCode }),
            },
            customLogLevel: (_req, res, err) => {
              if (err || res.statusCode >= 500) return 'error';
              if (res.statusCode >= 400) return 'warn';
              return 'info';
            },
            // Strip noisy health/asset paths if you add them later.
            autoLogging: true,
          },
        };
      },
    }),
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
    VisitorsModule,
    UnitsModule,
    NotificationsModule,
    TestimonialsModule,
    UsersModule,
    SiteSettingsModule,
    UploadsModule,
    EventsModule,
    OverviewModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
