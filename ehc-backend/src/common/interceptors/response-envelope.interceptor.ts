import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

/**
 * Wraps every successful response in `{ data, meta }`.
 *
 * Why a stable envelope:
 *  - Frontend writes one unwrap helper instead of inspecting every response shape
 *  - Adding cross-cutting fields later (pagination, deprecation hints, server time, etc.) doesn't
 *    require changing every controller
 *  - Error responses use a different envelope (see AllExceptionsFilter), so success vs failure is
 *    structurally distinguishable without HTTP status sniffing
 *
 * Controllers that need to bypass this (raw file downloads, redirects) can return a special
 * marker or use a per-handler interceptor exclusion. None today.
 */
export interface SuccessEnvelope<T> {
  data: T;
  meta: {
    timestamp: string;
    /** Future: pagination, version, deprecation hints. */
    [key: string]: unknown;
  };
}

@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, SuccessEnvelope<T>>
{
  intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<SuccessEnvelope<T>> {
    return next.handle().pipe(
      map((payload) => ({
        data: payload,
        meta: { timestamp: new Date().toISOString() },
      })),
    );
  }
}
