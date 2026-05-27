import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JwtAuthGuard tests.
 *
 * Verifies @Public() opt-out works. Cryptographic JWT verification is passport-jwt's
 * concern; we only test our metadata-driven branch.
 */

describe('JwtAuthGuard', () => {
  function makeContext(): ExecutionContext {
    return {
      getHandler: () => () => undefined,
      getClass: () => class {},
      switchToHttp: () => ({ getRequest: () => ({}) }),
    } as unknown as ExecutionContext;
  }

  it('skips JWT check when @Public() is set on handler', () => {
    const reflector = {
      getAllAndOverride: jest.fn((key) => key === IS_PUBLIC_KEY),
    } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);

    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('delegates to passport when @Public() is not set', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    // We don't actually run passport; we just verify the guard called super.canActivate.
    // Spy on the prototype's canActivate.
    const spy = jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
      .mockReturnValue(true);

    expect(guard.canActivate(makeContext())).toBe(true);
    expect(spy).toHaveBeenCalled();
  });
});
