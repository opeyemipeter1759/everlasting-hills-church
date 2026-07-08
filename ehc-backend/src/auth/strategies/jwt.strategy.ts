import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../types/auth-user';
import { EffectiveRolesService } from '../effective-roles.service';

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
 * This project's Supabase instance was migrated to ES256 (ECC P-256) on 2026-05-20.
 * We never possess the private key — Supabase signs, we only verify with the public key
 * fetched from <SUPABASE_URL>/auth/v1/.well-known/jwks.json. jwks-rsa caches the keyset and
 * auto-refreshes when Supabase rotates (kid header points at the right public key).
 *
 * Cost: one HTTP GET on cold start (~50ms once), cached thereafter.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
    private readonly effectiveRoles: EffectiveRolesService,
  ) {
    const supabaseUrl = config.get('SUPABASE_URL', { infer: true });
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      }),
      algorithms: ['ES256'],
      audience: 'authenticated',
      issuer: `${supabaseUrl}/auth/v1`,
    });
  }

  /**
   * Passport calls this AFTER signature + expiry + audience + issuer pass.
   * Whatever we return is attached to req.user.
   */
  async validate(payload: SupabaseJwtPayload): Promise<AuthUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token: missing sub');
    }

    const email = String(payload.email ?? '');

    // Identity only (no role): profile + linked member, by Supabase user id.
    const profile = await this.prisma.profile.findUnique({
      where: { userId: payload.sub },
      select: {
        id: true,
        tenantId: true,
        Member: { select: { id: true } },
      },
    });

    // Roles are resolved per request from grants + active assignments (never from
    // the JWT), so revocations take effect immediately on the next request.
    const eff = await this.effectiveRoles.getEffectiveRoles(profile?.id ?? null);

    return {
      userId: payload.sub,
      email,
      role: profile ? eff.primaryRole : null,
      effectiveRoles: profile ? eff.roles : [],
      unitLeadOf: eff.unitLeadOf,
      adminHeadOf: eff.adminHeadOf,
      headUsher: eff.headUsher,
      profileId: profile?.id ?? null,
      memberId: profile?.Member?.id ?? null,
      tenantId: profile?.tenantId ?? null,
    };
  }
}
