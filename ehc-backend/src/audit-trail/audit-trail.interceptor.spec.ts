import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, of, throwError } from 'rxjs';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma/prisma.service';
import { AuditTrailInterceptor } from './audit-trail.interceptor';

@ApiTags('users')
@Controller('users')
class UsersFake {
  @Post(':profileId/grants')
  @ApiOperation({ summary: 'Grant a global role (PASTOR / ADMIN / SUPER_ADMIN), additive' })
  grant(@Param('profileId') _id: string, @Body() _b: unknown) {}

  @Post(':profileId/password')
  @ApiOperation({ summary: 'Set a password' })
  password() {}
}

@ApiTags('push')
@Controller('push')
class PushFake {
  @Post('subscribe')
  @ApiOperation({ summary: 'Register this device' })
  subscribe() {}
}

@ApiTags('units')
@Controller('units')
class UnitsFake {
  @Post(':unitId/messages')
  @ApiOperation({ summary: 'Message another member of the unit' })
  message() {}

  @Delete(':unitId')
  @ApiOperation({ summary: 'Delete a unit (ADMIN+)' })
  remove() {}
}

const user = { userId: 'auth-1', tenantId: 't1' };

function setup() {
  const create = jest.fn().mockResolvedValue({});
  const prisma = {
    auditLog: { create },
    profile: { findUnique: jest.fn().mockResolvedValue({ Member: { firstName: 'Ada', lastName: 'Eze' } }) },
    unit: { findUnique: jest.fn().mockResolvedValue({ name: 'Choir' }) },
  } as unknown as PrismaService;
  const config = { get: () => 'tenant-1' } as unknown as ConfigService<never, true>;
  const interceptor = new AuditTrailInterceptor(new Reflector(), prisma, config as never);

  async function call(cls: object, handler: string, req: Record<string, unknown>, result = of({ ok: true })) {
    const ctx = new ExecutionContextHost([{ originalUrl: '/x', query: {}, ...req }, { statusCode: 201 }], cls as never, (cls as { prototype: Record<string, () => void> }).prototype[handler]);
    return lastValueFrom(interceptor.intercept(ctx, { handle: () => result }));
  }
  return { create, call };
}

describe('the audit trail interceptor', () => {
  it('records who granted what to whom, with the summary, the target and the body', async () => {
    const { create, call } = setup();
    const out = await call(UsersFake, 'grant', { method: 'POST', user, params: { profileId: 'profile-01' }, body: { role: 'ADMIN' }, originalUrl: '/users/profile-01/grants' });

    expect(out).toEqual({ ok: true });
    expect(create).toHaveBeenCalledTimes(1);
    const data = create.mock.calls[0][0].data;
    expect(data).toMatchObject({ tenantId: 'tenant-1', actorId: 'auth-1', action: 'REQUEST', entity: 'users', entityId: 'profile-01' });
    expect(data.after).toMatchObject({
      summary: 'Grant a global role (PASTOR / ADMIN / SUPER_ADMIN), additive',
      method: 'POST',
      route: '/users/:profileId/grants',
      path: '/users/profile-01/grants',
      params: { profileId: 'profile-01' },
      body: { role: 'ADMIN' },
      targets: [{ kind: 'Person', name: 'Ada Eze' }],
      status: 201,
    });
  });

  it('names a unit before it is deleted', async () => {
    const { create, call } = setup();
    await call(UnitsFake, 'remove', { method: 'DELETE', user, params: { unitId: 'unit-0001' }, body: {} });
    expect(create.mock.calls[0][0].data.after).toMatchObject({ targets: [{ kind: 'Unit', name: 'Choir' }], body: null });
  });

  it('hides secrets in the body', async () => {
    const { create, call } = setup();
    await call(UsersFake, 'password', { method: 'POST', user, params: { profileId: 'profile-01' }, body: { password: 'hunter2' } });
    expect(create.mock.calls[0][0].data.after.body).toEqual({ password: '[hidden]' });
  });

  it('keeps a private message as an action, without the words', async () => {
    const { create, call } = setup();
    await call(UnitsFake, 'message', { method: 'POST', user, params: { unitId: 'unit-0001' }, body: { text: 'between us' } });
    const after = create.mock.calls[0][0].data.after;
    expect(after.bodyHidden).toBe(true);
    expect(after.body).toBeUndefined();
  });

  it('leaves out reads, anonymous requests, noisy routes and failed changes', async () => {
    const { create, call } = setup();
    await call(UsersFake, 'grant', { method: 'GET', user, params: { profileId: 'profile-01' } });
    await call(UsersFake, 'grant', { method: 'POST', params: { profileId: 'profile-01' } });
    await call(PushFake, 'subscribe', { method: 'POST', user, params: {} });
    await expect(call(UsersFake, 'grant', { method: 'POST', user, params: { profileId: 'profile-01' } }, throwError(() => new Error('no')))).rejects.toThrow('no');
    expect(create).not.toHaveBeenCalled();
  });

  it('never fails the change when the audit write fails', async () => {
    const { create, call } = setup();
    create.mockRejectedValueOnce(new Error('db down'));
    await expect(call(UsersFake, 'grant', { method: 'POST', user, params: { profileId: 'profile-01' }, body: {} })).resolves.toEqual({ ok: true });
  });
});
