import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;
  /** Reused for password auth and session ops where we don't need user-scoped headers. */
  private readonly anonClient: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.supabaseUrl = config.get('SUPABASE_URL', { infer: true });
    this.supabaseAnonKey = config.get('SUPABASE_ANON_KEY', { infer: true });
    this.anonClient = createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  /**
   * Look up the application role for an authenticated Supabase user.
   *
   * Lookup by Profile.userId (the Supabase auth user UUID), matching JwtStrategy.
   * Email-based lookup (the old approach) was fragile — admins/pastors who aren't Members
   * had no email match, and email changes broke the link. userId is the stable identifier.
   *
   * Returns null only when the Supabase user has no Profile row at all (genuine new-signup
   * before admin assigns role).
   */
  private async getRoleByUserId(userId: string): Promise<string | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { role: true },
    });
    return profile?.role ?? null;
  }

  async login(email: string, password: string) {
    const { data, error } = await this.anonClient.auth.signInWithPassword({ email, password });

    if (error || !data.user || !data.session) {
      this.logger.warn(`Login failed for ${email}: ${error?.message ?? 'no session'}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const role = await this.getRoleByUserId(data.user.id);

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
      },
    };
  }

  async logout(authorization?: string) {
    const accessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';

    if (!accessToken) {
      throw new UnauthorizedException('Access token is required');
    }

    /**
     * Per-request client scoped to the user's token. We can't reuse anonClient because
     * signOut() needs the user's session context to invalidate it server-side at Supabase.
     */
    const scoped = createClient(this.supabaseUrl, this.supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await scoped.auth.signOut();
    if (error) {
      this.logger.warn(`Logout failed: ${error.message}`);
      throw new UnauthorizedException('Logout failed');
    }

    return { success: true, message: 'Logged out successfully' };
  }
}
