import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { AttendanceModule } from './attendance/attendance.module';
import { FormsModule } from './forms/forms.module';
import { SermonsModule } from './sermons/sermons.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { AnalyticsModule } from './analytics/analytics.module';
import { MembersModule } from './members/members.module';
import type { Env } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    /**
     * Don't auto-abort on uncaught shutdown errors — let Nest's lifecycle hooks run
     * so PrismaService can disconnect cleanly.
     */
    abortOnError: false,
  });

  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const logger = new Logger('Bootstrap');

  /**
   * HTTP security headers (CSP, HSTS, X-Frame-Options, etc.).
   * Defaults are sensible; tighten if we add inline scripts or specific CSP needs.
   */
  app.use(helmet());

  /**
   * CORS lockdown.
   *
   * Why explicit list (not wildcard): credentials: true with origin: '*' is rejected by browsers.
   * In dev we allow common local origins; in prod we require FRONTEND_URL to be set explicitly.
   */
  const nodeEnv = config.get('NODE_ENV', { infer: true });
  const frontendUrl = config.get('FRONTEND_URL', { infer: true });
  const allowedOrigins =
    nodeEnv === 'production'
      ? frontendUrl
        ? [frontendUrl]
        : (() => {
            throw new Error('FRONTEND_URL must be set in production');
          })()
      : [
          frontendUrl,
          'http://localhost:3000',
          'http://localhost:3001',
        ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  /**
   * Global validation. Together these three options give us:
   *   whitelist:             strip any field not declared on the DTO (defense in depth)
   *   forbidNonWhitelisted:  reject requests with unknown fields rather than silently stripping
   *   transform:             coerce primitives ('5' → 5, 'true' → true) using class-transformer
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  /**
   * Order matters:
   *   - Filter catches everything thrown, including from interceptors → registered first
   *   - Interceptor wraps every successful response in { data, meta }
   * Together they give us a stable contract: success ⇒ { data, meta }, failure ⇒ { error }
   */
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  /**
   * Swagger. Restricting include[] to known modules avoids scanning dynamically created
   * internal modules that lack route metadata.
   */
  const swagger = new DocumentBuilder()
    .setTitle('church-api')
    .setDescription('API documentation for Everlasting Hills Church')
    .setVersion('0.1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  try {
    const document = SwaggerModule.createDocument(app, swagger, {
      include: [AppModule, AuthModule, AttendanceModule, FormsModule, SermonsModule, AnalyticsModule, MembersModule],
    });
    // include MembersModule by referencing via AppModule's imports at runtime
    SwaggerModule.setup('docs', app, document);
  } catch (err) {
    logger.warn(`Swagger setup failed; continuing without docs: ${(err as Error).message}`);
  }

  /**
   * Graceful shutdown so Prisma + supabase clients drain on SIGINT/SIGTERM.
   * Without this, deploys can drop in-flight requests.
   */
  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  logger.log(`church-api running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/docs`);
}

void bootstrap();
