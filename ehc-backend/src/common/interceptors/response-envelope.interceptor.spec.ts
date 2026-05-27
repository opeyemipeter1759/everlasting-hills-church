import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';

/**
 * ResponseEnvelopeInterceptor tests.
 *
 * Verifies the success envelope shape: { data, meta: { timestamp: ISO-string } }.
 * Every controller return value passes through here — invariant: callers see `data: T`.
 */

const dummyContext = {} as ExecutionContext;

function makeHandler<T>(value: T): CallHandler<T> {
  return { handle: () => of(value) };
}

describe('ResponseEnvelopeInterceptor', () => {
  it('wraps primitive payload in { data, meta }', async () => {
    const interceptor = new ResponseEnvelopeInterceptor<number>();
    const result = await lastValueFrom(interceptor.intercept(dummyContext, makeHandler(42)));

    expect(result.data).toBe(42);
    expect(typeof result.meta.timestamp).toBe('string');
    expect(new Date(result.meta.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('wraps object payload', async () => {
    const interceptor = new ResponseEnvelopeInterceptor<{ id: string }>();
    const result = await lastValueFrom(
      interceptor.intercept(dummyContext, makeHandler({ id: 'abc' })),
    );

    expect(result.data).toEqual({ id: 'abc' });
  });

  it('wraps array payload', async () => {
    const interceptor = new ResponseEnvelopeInterceptor<number[]>();
    const result = await lastValueFrom(
      interceptor.intercept(dummyContext, makeHandler([1, 2, 3])),
    );

    expect(result.data).toEqual([1, 2, 3]);
  });

  it('wraps null payload as data: null (no surprise unwrapping)', async () => {
    const interceptor = new ResponseEnvelopeInterceptor<null>();
    const result = await lastValueFrom(interceptor.intercept(dummyContext, makeHandler(null)));

    expect(result.data).toBeNull();
  });

  it('attaches a fresh timestamp per call', async () => {
    const interceptor = new ResponseEnvelopeInterceptor<number>();
    const a = await lastValueFrom(interceptor.intercept(dummyContext, makeHandler(1)));
    await new Promise((r) => setTimeout(r, 5));
    const b = await lastValueFrom(interceptor.intercept(dummyContext, makeHandler(2)));

    expect(b.meta.timestamp >= a.meta.timestamp).toBe(true);
  });
});
