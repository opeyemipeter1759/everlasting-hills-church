import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Best-effort auth for otherwise-@Public() routes: if a valid Supabase JWT is
 * present, `req.user` is populated (same AuthUser shape as JwtStrategy.validate())
 * so the handler can capture the signed-in submitter's identity; if the token is
 * missing or invalid, this never throws — it just leaves `req.user` unset so the
 * route stays reachable by logged-out visitors.
 *
 * Stack this via @UseGuards() alongside @Public() (the global JwtAuthGuard skips
 * passport entirely for @Public() routes, so this runs the strategy separately).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    // Passport's default handleRequest passes user=false on missing/invalid
    // credentials (not null/undefined) — collapse every falsy case to undefined
    // so `req.user` is cleanly unset rather than the literal boolean `false`.
    return (user || undefined) as TUser;
  }
}
