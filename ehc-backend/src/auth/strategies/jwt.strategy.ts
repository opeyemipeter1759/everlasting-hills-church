import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import type { AuthUser } from '../types/auth-user';

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  role?: string; // Supabase puts "authenticated" here, NOT our app role
  [key: string]: unknown;
}

/**
 * Verifies Supabase-issued JWTs locally using SUPABASE_JWT_SECRET.
 *
 * Why local verification (not Supabase API call):
 *  - 0 network hops per request — adding a Supabase round-trip would add ~100-300ms to every API call
 *  - the HS256 signature is sufficient proof of authenticity; the secret is shared between Supabase and us
 *
 * Why we look up the Profile here:
 *  - Supabase's JWT carries `role: "authenticated"` (a Supabase concept), not our app role hierarchy
 *  - Looking up Profile.role makes RolesGuard's check trivial (already resolved)
 *  - Cost: 1 indexed query per request. Acceptable; cache in Week 2 if it becomes hot.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: String(config.get('SUPABASE_JWT_SECRET')),
      // Supabase signs with HS256 by default
      algorithms: ['HS256'],
      // Supabase JWTs use "authenticated" as the audience
      audience: 'authenticated',
    });
  }

  /**
   * Passport calls this AFTER signature + expiry + audience checks pass.
   * Whatever we return is attached to req.user.
   */
  async validate(payload: SupabaseJwtPayload): Promise<AuthUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token: missing sub');
    }

    const email = String(payload.email ?? '');

    // Single query: profile + linked member, by Supabase user id
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
