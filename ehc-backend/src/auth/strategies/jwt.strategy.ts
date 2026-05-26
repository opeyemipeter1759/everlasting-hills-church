import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../types/auth-user';

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  role?: string; // Supabase puts "authenticated" here — not our app role
  [key: string]: unknown;
}

/**
 * Verifies Supabase-issued JWTs using JWKS (asymmetric ES256).
 *
 * Why JWKS / asymmetric instead of a shared HS256 secret:
 *  - Supabase migrated this project to ES256 (ECC P-256) signing on 2026-05-20
 *  - We never possess the private key — Supabase signs, we only verify with the public key
 *  - JWKS is fetched once from a well-known URL, cached, and auto-refreshed when Supabase
 *    rotates keys (the JWT carries a `kid` header that points at the right public key)
 *  - Zero secret synchronization between services
 *
 * Cost: one HTTP GET on cold start (~50ms once). Cached thereafter; refresh on unknown kid.
 *
 * Profile lookup still happens on every request to resolve app role. Cacheable in Week 3+.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    config: ConfigService<Env, true>,
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = config.get('SUPABASE_URL', { infer: true });
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Resolves the signing public key per-token via Supabase's JWKS endpoint.
      // jwks-rsa handles caching, rate limiting, and rotation transparently.
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      }),
      // Supabase signs with ES256 (ECC P-256) on the new keyset.
      // HS256 retained as fallback for tokens issued before rotation (they'll expire soon).
      algorithms: ['ES256', 'HS256'],
      secretOrKey: String(config.get('SUPABASE_JWT_SECRET')),
      // Supabase signs with HS256 by default
      algorithms: ['HS256'],
      // Supabase JWTs use "authenticated" as the audience
      audience: 'authenticated',
      issuer: `${supabaseUrl}/auth/v1`,
    });
  }

  /**
   * Passport calls this AFTER signature + expiry + audience + issuer pass.
   */
  async validate(payload: SupabaseJwtPayload): Promise<AuthUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token: missing sub');
    }

    const email = String(payload.email ?? '');

    const profile = await this.prisma.profile.findUnique({
      where: { userId: payload.sub },
      select: {
        id: true,
        role: true,
        tenantId: true,
        Member: { select: { id: true } },
      },
    });

    return {
      userId: payload.sub,
      email,
      role: profile?.role ?? null,
      profileId: profile?.id ?? null,
      memberId: profile?.Member?.id ?? null,
      tenantId: profile?.tenantId ?? null,
    };
  }
}
