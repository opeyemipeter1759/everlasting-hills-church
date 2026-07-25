import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../../config/env.validation';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildPasswordChangedEmail } from '../../notifications/templates/password-changed.email';
import { AuthSupabaseService } from './auth-supabase.service';

@Injectable()
export class AuthPasswordService {
  private readonly logger = new Logger(AuthPasswordService.name);
  private readonly publicSiteUrl: string;

  constructor(
    private readonly events: EventEmitter2,
    private readonly supabase: AuthSupabaseService,
    config: ConfigService<Env, true>,
  ) {
    this.publicSiteUrl =
      (config.get('FRONTEND_URL', { infer: true }) as string | undefined) ?? 'http://localhost:3000';
  }

  async changePassword(authorization: string | undefined, password: string, ip?: string) {
    const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
    if (!accessToken) throw new UnauthorizedException('Access token is required');

    const { data: userData, error: userError } = await this.supabase.anonClient.auth.getUser(accessToken);
    if (userError || !userData?.user) {
      this.logger.warn(`Password change rejected — invalid token: ${userError?.message ?? 'no user'}`);
      throw new UnauthorizedException('Your session is no longer valid. Please sign in again.');
    }
    const userId = userData.user.id;
    const currentMetadata = (userData.user.user_metadata as Record<string, unknown> | null | undefined) ?? {};

    // Step 2: admin updateUserById is the reliable write path. Merge metadata
    // explicitly because admin.updateUserById replaces (not merges) user_metadata.
    let admin: SupabaseClient;
    try {
      admin = this.supabase.createAdminClient();
    } catch (err) {
      this.logger.error(`Admin client unavailable for password change: ${(err as Error).message}`);
      throw new UnauthorizedException('Password changes are not configured on this server. Contact an admin.');
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { ...currentMetadata, needs_password_change: false },
    });
    if (updateError) {
      this.logger.warn(`Password change failed for ${userId}: ${updateError.message}`);
      throw new UnauthorizedException(updateError.message || 'Could not update password');
    }

    this.logger.log(`Password changed for ${userData.user.email ?? userId}`);

    // Fire-and-forget security confirmation (covers forced first-login change and
    // password-reset completion — both flow through this endpoint).
    if (userData.user.email) {
      this.events.emit(
        NotificationEvents.SendEmail,
        buildPasswordChangedEmail({
          email: userData.user.email,
          firstName: (currentMetadata.full_name as string | undefined)?.split(' ')[0],
          when: new Date(),
          ip,
          appUrl: this.publicSiteUrl,
        }),
      );
    }

    return { success: true, message: 'Password updated successfully' };
  }
}
