import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY, OPTIONAL_AUTH_KEY } from '../decorators/public.decorator';

/**
 * Global auth guard.
 *
 * Default behavior: every route requires a valid Supabase JWT.
 * Routes marked with @Public() skip the check.
 *
 * Registered globally in AuthModule via APP_GUARD — no per-controller wiring required.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets);
    if (isPublic) {
      // @OptionalAuth(): identify the caller when they sent a valid token, but
      // never reject — anonymous visitors get the public view.
      if (this.reflector.getAllAndOverride<boolean>(OPTIONAL_AUTH_KEY, targets)) {
        return this.tryAuthenticate(context);
      }
      return true;
    }
    return super.canActivate(context);
  }

  private async tryAuthenticate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ headers?: Record<string, unknown> }>();
    if (!req.headers?.authorization) return true;
    try {
      await (super.canActivate(context) as Promise<boolean>);
    } catch {
      // invalid/expired token → treat as anonymous
    }
    return true;
  }
}
