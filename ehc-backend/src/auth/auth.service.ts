import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';

interface UserProfileSummary {
  role: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
}

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
   * Resolve the application's view of a Supabase auth user.
   *
   * Lookup by Profile.userId (the Supabase auth UUID) — same path JwtStrategy uses.
   * Returns null fields when the user has signed up but no Profile/Member row exists yet.
   */
  private async getProfileSummary(userId: string): Promise<UserProfileSummary> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: {
        role: true,
        Member: { select: { firstName: true, lastName: true, photoUrl: true } },
      },
    });
    return {
      role: profile?.role ?? null,
      firstName: profile?.Member?.firstName ?? null,
      lastName: profile?.Member?.lastName ?? null,
      photoUrl: profile?.Member?.photoUrl ?? null,
    };
  }

  async login(email: string, password: string) {
    const { data, error } = await this.anonClient.auth.signInWithPassword({ email, password });
    if (error || !data.user || !data.session) {
      this.logger.warn(`Login failed for ${email}: ${error?.message ?? 'no session'}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const summary = await this.getProfileSummary(data.user.id);
    const fullName =
      summary.firstName || summary.lastName
        ? `${summary.firstName ?? ''} ${summary.lastName ?? ''}`.trim()
        : null;

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: summary.role,
        fullName,
        picture: summary.photoUrl,
      },
    };
  }

  /**
   * @deprecated Use @CurrentUser() in controllers instead.
   *
   * Legacy helper for controllers that take the raw Authorization header and want
   * "who is this caller". Validates the JWT against Supabase, then loads the Profile.
   *
   * Cost: one Supabase network call + one DB query per request. Migrate callers to
   * @UseGuards(JwtAuthGuard) + @CurrentUser to eliminate the network hop.
   */
  async getProfile(authorization?: string) {
    const accessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';
    if (!accessToken) throw new UnauthorizedException('Access token is required');

    const supabase = createClient(this.supabaseUrl, this.supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      this.logger.warn(`Supabase getUser failed: ${error?.message ?? 'no user'}`);
      throw new UnauthorizedException('Invalid access token');
    }

    const summary = await this.getProfileSummary(data.user.id);
    const fullName =
      summary.firstName || summary.lastName
        ? `${summary.firstName ?? ''} ${summary.lastName ?? ''}`.trim()
        : null;

    return {
      id: data.user.id,
      email: data.user.email,
      role: summary.role,
      fullName,
      picture: summary.photoUrl,
    };
  }

  async logout(authorization?: string) {
    const accessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';
    if (!accessToken) {
      throw new UnauthorizedException('Access token is required');
    }

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

  /**
   * Returns the currently-authenticated user's identity + their Member profile.
   * The userId is sourced from the JWT (already verified by JwtAuthGuard).
   *
   * Used by /auth/me on the controller — the dashboard's single point of truth for
   * "who am I and what does my profile look like".
   */
  async getMe(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: {
        id: true,
        role: true,
        tenantId: true,
        Member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            dateOfBirth: true,
            bio: true,
            photoUrl: true,
            joinedAt: true,
          },
        },
      },
    });

    if (!profile) {
      // Authenticated Supabase user with no Profile row yet — orphan account.
      // Return enough for the UI to render a "complete your profile" state.
      return { profileId: null, role: null, tenantId: null, member: null };
    }

    return {
      profileId: profile.id,
      role: profile.role,
      tenantId: profile.tenantId,
      member: profile.Member
        ? {
            ...profile.Member,
            dateOfBirth: profile.Member.dateOfBirth
              ? profile.Member.dateOfBirth.toISOString()
              : null,
            joinedAt: profile.Member.joinedAt.toISOString(),
          }
        : null,
    };
  }
}
