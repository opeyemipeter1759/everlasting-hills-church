import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Env } from '../../config/env.validation';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildPasswordResetEmail } from '../../notifications/templates/password-reset.email';
import { createRecoveryLink } from '../recovery-link';
import { AuthSupabaseService } from './auth-supabase.service';
import { AuthProfileSummaryService } from './auth-profile-summary.service';
import { assertActiveMemberAccount, isMemberAccountInactive } from '../member-account-status';

@Injectable()
export class AuthSessionService {
  private readonly logger = new Logger(AuthSessionService.name);
  private readonly publicSiteUrl: string;

  constructor(
    private readonly supabase: AuthSupabaseService,
    private readonly profileSummary: AuthProfileSummaryService,
    private readonly events: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    // The recovery email links to `${publicSiteUrl}/change-password`.
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
    if (isMemberAccountInactive(summary.memberStatus)) {
      this.logger.warn(`Session refresh blocked for non-active member: ${data.user.email}`);
    }
    assertActiveMemberAccount(summary.memberStatus);
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
   * Emails a one-time link to the change-password page. We send it ourselves
   * (not Supabase) so the link always opens the live site. The reply is the
   * same whether or not the account exists, so it can't be used to probe emails.
   */
  async requestPasswordReset(email: string) {
    const result = await createRecoveryLink(email, this.publicSiteUrl);
    if (result.link) {
      // Awaited so the send finishes inside this request — on Cloud Run the
      // instance gets no CPU once the response is out.
      await this.events.emitAsync(
        NotificationEvents.SendEmail,
        buildPasswordResetEmail({ email, link: result.link, purpose: 'reset' }),
      );
    } else {
      // Log but do not leak: unknown addresses land here too.
      this.logger.warn(`Password reset request for ${email}: ${result.reason}`);
    }
    return {
      success: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    };
  }

  /**
   * Opens the link from the reset email: exchanges its one-time token for a
   * short-lived session, which the change-password page uses to set the new
   * password. A token works once and expires after an hour.
   */
  async verifyRecovery(tokenHash: string) {
    const { data, error } = await this.supabase.anonClient.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
    if (error || !data.session) {
      this.logger.warn(`Recovery link rejected: ${error?.message ?? 'no session'}`);
      throw new UnauthorizedException('This password-reset link is invalid or has expired. Request a new one.');
    }
    return { access_token: data.session.access_token, expires_in: data.session.expires_in };
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
