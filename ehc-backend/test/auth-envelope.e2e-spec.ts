import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';

/**
 * E2E: end-to-end contract verification.
 *
 * We mount a tiny module instead of the full AppModule so the e2e doesn't depend on a real
 * Postgres connection. Goal: prove that the global filter + interceptor compose correctly
 * across a real HTTP roundtrip.
 *
 * What this covers that unit tests don't:
 *   - ValidationPipe + filter integration (400 with details surface as JSON)
 *   - Interceptor wraps controller return value, not the error
 *   - Header (x-request-id) actually reaches the wire
 */

import { Body, Controller, Get, Module, Post } from '@nestjs/common';
import { IsEmail, MinLength } from 'class-validator';

class TestLoginDto {
  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;
}

@Controller('test')
class TestController {
  @Get('hello')
  hello() {
    return { greeting: 'world' };
  }

  @Get('fail')
  fail() {
    throw new Error('Boom');
  }

  @Post('login')
  login(@Body() body: TestLoginDto) {
    return { email: body.email };
  }
}

@Module({ controllers: [TestController] })
class TestModule {}

describe('Auth + Envelope (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [TestModule] }).compile();
    app = moduleRef.createNestApplication();

    // Mirror the production main.ts setup
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('wraps success responses in { data, meta }', async () => {
    const res = await request(app.getHttpServer()).get('/test/hello').expect(200);
    expect(res.body).toMatchObject({
      data: { greeting: 'world' },
      meta: { timestamp: expect.any(String) },
    });
  });

  it('wraps server errors in { error } envelope and includes x-request-id header', async () => {
    const res = await request(app.getHttpServer()).get('/test/fail').expect(500);
    expect(res.body).toMatchObject({
      error: {
        statusCode: 500,
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        requestId: expect.stringMatching(/[0-9a-f-]{36}/),
      },
    });
    expect(res.headers['x-request-id']).toBe(res.body.error.requestId);
  });

  it('returns 400 with field-level details when ValidationPipe rejects body', async () => {
    const res = await request(app.getHttpServer())
      .post('/test/login')
      .send({ email: 'not-an-email', password: 'x' })
      .expect(400);
    expect(res.body.error.statusCode).toBe(400);
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(1);
  });

  it('echoes caller-supplied x-request-id back in the response header and body', async () => {
    const callerId = 'caller-supplied-id-abc-123';
    const res = await request(app.getHttpServer())
      .get('/test/fail')
      .set('x-request-id', callerId)
      .expect(500);

    expect(res.body.error.requestId).toBe(callerId);
    expect(res.headers['x-request-id']).toBe(callerId);
  });

  it('strips unknown fields rejected by whitelist+forbidNonWhitelisted', async () => {
    const res = await request(app.getHttpServer())
      .post('/test/login')
      .send({ email: 'a@b.com', password: 'sixchar', extraGarbage: 'x' })
      .expect(400);
    expect(res.body.error.statusCode).toBe(400);
  });
});
