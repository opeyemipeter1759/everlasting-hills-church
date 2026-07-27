import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildNewDeviceLoginEmail } from '../../notifications/templates/new-device-login.email';
import { describeUserAgent, type LoginContext } from '../auth.types';
import { AuthSupabaseService } from './auth-supabase.service';
import { AuthProfileSummaryService } from './auth-profile-summary.service';

@Injectable()
export class AuthLoginService {
  private readonly logger = new Logger(AuthLoginService.name);
  private readonly tenantId: string;
  private readonly publicSiteUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly supabase: AuthSupabaseService,
    private readonly profileSummary: AuthProfileSummaryService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.publicSiteUrl =
      (config.get('FRONTEND_URL', { infer: true }) as string | undefined) ?? 'http://localhost:3000';
  }

  async login(email: string, password: string, ctx?: LoginContext) {
    const { data, error } = await this.supabase.anonClient.auth.signInWithPassword({ email, password });
    if (error || !data.user || !data.session) {
      this.logger.warn(`Login failed for ${email}: ${error?.message ?? 'no session'}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const summary = await this.profileSummary.getProfileSummary(data.user.id);
    if (summary.memberStatus === 'OPTED_OUT') {
      this.logger.warn(`Login blocked for opted-out member: ${email}`);
      throw new UnauthorizedException('This account has been opted out. Contact your team leader to be restored.');
    }
    const fullName =
      summary.firstName || summary.lastName
        ? `${summary.firstName ?? ''} ${summary.lastName ?? ''}`.trim()
        : null;

    // Fire-and-forget: record the device and alert if it's new for this account.
    void this.checkLoginDevice(data.user.id, data.user.email, summary.firstName, ctx);

    const needsPasswordChange = Boolean(
      (data.user.user_metadata as Record<string, unknown> | null | undefined)?.['needs_password_change'],
    );

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
        needsPasswordChange,
      },
    };
  }

  /**
   * Record the device used for this login. If it's a device we've never seen for
   * this account (and the account already had at least one known device), send a
   * security alert. Swallows its own errors — never affects the login response.
   */
  private async checkLoginDevice(
    userId: string,
    email: string | undefined,
    firstName: string | null,
    ctx?: LoginContext,
  ) {
    if (!email) return;
    const ua = ctx?.userAgent ?? '';
    const fingerprint = createHash('sha256').update(ua || 'unknown').digest('hex').slice(0, 32);

    try {
      const existing = await this.prisma.knownDevice.findUnique({
        where: { userId_fingerprint: { userId, fingerprint } },
      });
      if (existing) {
        await this.prisma.knownDevice.update({
          where: { id: existing.id },
          data: { lastSeenAt: new Date(), lastIp: ctx?.ip ?? existing.lastIp },
        });
        return;
      }

      const knownCount = await this.prisma.knownDevice.count({ where: { userId } });
      await this.prisma.knownDevice.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          userId,
          fingerprint,
          userAgent: ua || null,
          lastIp: ctx?.ip ?? null,
        },
      });

      // Don't alert on the very first device an account ever uses.
      if (knownCount > 0) {
        this.events.emit(
          NotificationEvents.SendEmail,
          buildNewDeviceLoginEmail({
            email,
            firstName: firstName ?? undefined,
            device: describeUserAgent(ua),
            ip: ctx?.ip,
            when: new Date(),
            appUrl: this.publicSiteUrl,
          }),
        );
      }
    } catch (err) {
      this.logger.warn(`Device check failed for ${userId}: ${(err as Error).message}`);
    }
  }
}
