import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AccountAwareThrottlerGuard } from '../auth/guards/account-aware-throttler.guard';
import { PolicyService } from '../premarital/policy';
import { PublicApplicationsService } from '../premarital/public-applications.service';
import { PublicPremaritalController } from '../premarital/public-premarital.controller';
import {
  CLIENT_IP_HEADER,
  CLIENT_IP_SIG_HEADER,
  CLIENT_IP_TS_HEADER,
  signClientIp,
  verifiedClientIp,
} from './client-ip';

const SECRET = 'a-test-secret-that-is-long-enough-to-use';
const now = 1_790_000_000_000;
const signed = (ip: string, ts = Math.floor(now / 1000), secret = SECRET) => ({
  [CLIENT_IP_HEADER]: ip,
  [CLIENT_IP_TS_HEADER]: String(ts),
  [CLIENT_IP_SIG_HEADER]: signClientIp(ip, ts, secret),
});

describe('signed visitor IP', () => {
  it('accepts a fresh signature from our website', () => {
    expect(verifiedClientIp(signed('102.89.4.7'), SECRET, now)).toBe('102.89.4.7');
    expect(verifiedClientIp(signed('2c0f:f5c0::1'), SECRET, now)).toBe('2c0f:f5c0::1');
  });

  it('ignores stale, tampered, wrongly keyed or missing signatures', () => {
    expect(verifiedClientIp(signed('102.89.4.7', Math.floor(now / 1000) - 61), SECRET, now)).toBeNull();
    expect(verifiedClientIp({ ...signed('102.89.4.7'), [CLIENT_IP_HEADER]: '1.2.3.4' }, SECRET, now)).toBeNull();
    expect(verifiedClientIp(signed('102.89.4.7', undefined, 'another-secret-also-long-enough-here'), SECRET, now)).toBeNull();
    expect(verifiedClientIp({}, SECRET, now)).toBeNull();
    expect(verifiedClientIp(signed('102.89.4.7'), undefined, now)).toBeNull();
    expect(verifiedClientIp({ ...signed('102.89.4.7'), [CLIENT_IP_HEADER]: 'not an ip!' }, SECRET, now)).toBeNull();
  });
});

describe('rate limits on the public application form, per signed visitor', () => {
  let app: INestApplication;
  const submit = jest.fn(async () => ({ referenceCode: 'PMC-TEST01' }));

  beforeAll(async () => {
    process.env.CLIENT_IP_SIGNING_SECRET = SECRET;
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])],
      controllers: [PublicPremaritalController],
      providers: [
        { provide: PublicApplicationsService, useValue: { submit } },
        { provide: PolicyService, useValue: { publicView: jest.fn(async () => ({})) } },
        { provide: APP_GUARD, useClass: AccountAwareThrottlerGuard },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    delete process.env.CLIENT_IP_SIGNING_SECRET;
    await app?.close();
  });

  const post = (headers: Record<string, string>) => {
    const r = request(app.getHttpServer()).post('/public/premarital/applications').send({});
    for (const [k, v] of Object.entries(headers)) r.set(k, v);
    return r;
  };
  const fresh = (ip: string) => signed(ip, Math.floor(Date.now() / 1000));

  it('gives each signed visitor their own five a minute', async () => {
    for (let i = 0; i < 5; i++) await post(fresh('41.58.0.1')).expect(201);
    await post(fresh('41.58.0.1')).expect(429);
    // Someone else on another network is not held back by the first visitor.
    await post(fresh('105.112.0.9')).expect(201);
  });

  it('puts unsigned and badly signed requests in one shared bucket, which is limited, never unlimited', async () => {
    for (let i = 0; i < 5; i++) await post({}).expect(201);
    await post({}).expect(429);
    await post({ ...fresh('197.210.0.3'), [CLIENT_IP_SIG_HEADER]: '0'.repeat(64) }).expect(429);
    await post(signed('197.210.0.4', Math.floor(Date.now() / 1000) - 3600)).expect(429);
  });
});
