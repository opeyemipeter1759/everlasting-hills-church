import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import { AuthSupabaseService } from './auth-supabase.service';
import { AuthProfileSummaryService } from './auth-profile-summary.service';

@Injectable()
export class AuthSessionService {
  private readonly logger = new Logger(AuthSessionService.name);
  private readonly publicSiteUrl: string;

  constructor(
    private readonly supabase: AuthSupabaseService,
    private readonly profileSummary: AuthProfileSummaryService,
    config: ConfigService<Env, true>,
  ) {
    // Recovery link is sent by Supabase and lands at `${publicSiteUrl}/change-password`.
    this.publicSiteUrl =
      (config.get('FRONTEND_URL', { infer: true }) as string | undefined) ?? 'http://localhost:3000';
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const { data, error } = await this.supabase.anonClient.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session || !data.user) {
      this.logger.warn(`Token refresh failed: ${error?.message ?? 'no session'}`);
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    const summary = await this.profileSummary.getProfileSummary(data.user.id);
    if (summary.memberStatus === 'OPTED_OUT') {
      this.logger.warn(`Session refresh blocked for opted-out member: ${data.user.email}`);
      throw new UnauthorizedException('This account has been opted out. Contact your team leader to be restored.');
    }
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

  async requestPasswordReset(email: string) {
    const redirectTo = `${this.publicSiteUrl.replace(/\/$/, '')}/change-password`;
    const { error } = await this.supabase.anonClient.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      // Log but do not leak. Rate-limit failures from Supabase land here too.
      this.logger.warn(`Password reset request for ${email}: ${error.message}`);
    }
    return {
      success: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    };
  }

  async logout(authorization?: string) {
    const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
    if (!accessToken) {
      throw new UnauthorizedException('Access token is required');
    }

    const scoped = this.supabase.createScopedClient(accessToken);
    const { error } = await scoped.auth.signOut();
    if (error) {
      this.logger.warn(`Logout failed: ${error.message}`);
      throw new UnauthorizedException('Logout failed');
    }
    return { success: true, message: 'Logged out successfully' };
  }
}
