import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { ensureDefaultTenant } from '../tenant/ensure-default-tenant';

interface UserProfileSummary {
  role: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;
  private readonly supabaseServiceRoleKey: string | undefined;
  private readonly defaultSuperAdminEmail: string | undefined;
  private readonly defaultSuperAdminPassword: string | undefined;
  private readonly tenantId: string;
  private readonly publicSiteUrl: string;
  /** Reused for password auth and session ops where we don't need user-scoped headers. */
  private readonly anonClient: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.supabaseUrl = config.get('SUPABASE_URL', { infer: true });
    this.supabaseAnonKey = config.get('SUPABASE_ANON_KEY', { infer: true });
    this.supabaseServiceRoleKey = config.get('SUPABASE_SERVICE_ROLE_KEY', {
      infer: true,
    }) as string | undefined;
    this.defaultSuperAdminEmail = config.get('DEFAULT_SUPER_ADMIN_EMAIL', {
      infer: true,
    }) as string | undefined;
    this.defaultSuperAdminPassword = config.get(
      'DEFAULT_SUPER_ADMIN_PASSWORD',
      { infer: true },
    ) as string | undefined;
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    // Recovery link is sent by Supabase and lands at `${publicSiteUrl}/change-password`.
    this.publicSiteUrl =
      (config.get('FRONTEND_URL', { infer: true }) as string | undefined) ??
      'http://localhost:3000';
    this.anonClient = createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async onModuleInit() {
    try {
      await this.ensureDefaultSuperAdmin();
    } catch (err) {
      // Non-fatal: Supabase may be temporarily unreachable at startup (DNS, cold start).
      // The server continues running; the super-admin seed will be skipped this boot.
      this.logger.warn(
        `ensureDefaultSuperAdmin skipped: ${(err as Error).message}`,
      );
    }
  }

  private createAdminClient() {
    if (!this.supabaseServiceRoleKey) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY must be set for admin actions',
      );
    }

    return createClient(this.supabaseUrl, this.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private async ensureDefaultSuperAdmin() {
    if (!this.defaultSuperAdminEmail || !this.defaultSuperAdminPassword) {
      return;
    }

    const admin = this.createAdminClient();
    const email = this.defaultSuperAdminEmail.toLowerCase();

    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (error) {
      throw new Error(`Could not list Supabase users: ${error.message}`);
    }

    const existingUser =
      data.users.find((user) => user.email?.toLowerCase() === email) ?? null;

    let userId = existingUser?.id ?? null;
    if (existingUser) {
      const { data: updated, error: updateError } =
        await admin.auth.admin.updateUserById(existingUser.id, {
          password: this.defaultSuperAdminPassword,
          email_confirm: true,
          app_metadata: {
            ...(existingUser.app_metadata ?? {}),
            role: Role.SUPER_ADMIN,
          },
          user_metadata: {
            ...(existingUser.user_metadata ?? {}),
            role: Role.SUPER_ADMIN,
            full_name: 'Super Admin',
          },
        });

      if (updateError) {
        throw new Error(
          `Could not update default super admin: ${updateError.message}`,
        );
      }

      userId = updated.user.id;
    } else {
      const { data: created, error: createError } =
        await admin.auth.admin.createUser({
          email,
          password: this.defaultSuperAdminPassword,
          email_confirm: true,
          app_metadata: { role: Role.SUPER_ADMIN },
          user_metadata: { role: Role.SUPER_ADMIN, full_name: 'Super Admin' },
        });

      if (createError || !created.user) {
        throw new Error(
          `Could not create default super admin: ${createError?.message ?? 'unknown error'}`,
        );
      }

      userId = created.user.id;
    }

    await ensureDefaultTenant(this.prisma, this.tenantId);

    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: {
        id: randomUUID(),
        userId,
        tenantId: this.tenantId,
        role: Role.SUPER_ADMIN,
      },
      update: {
        tenantId: this.tenantId,
        role: Role.SUPER_ADMIN,
      },
    });

    await this.prisma.member.upsert({
      where: { profileId: profile.id },
      create: {
        id: randomUUID(),
        tenantId: this.tenantId,
        profileId: profile.id,
        firstName: 'Super',
        lastName: 'Admin',
        email,
        phone: null,
      },
      update: {
        tenantId: this.tenantId,
        firstName: 'Super',
        lastName: 'Admin',
        email,
      },
    });

    this.logger.log(`Default super admin ready: ${email}`);
  }

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

  private async getMemberByEmail(email: string) {
    return this.prisma.member.findFirst({
      where: { email },
      select: {
        firstName: true,
        lastName: true,
        photoUrl: true,
        Profile: { select: { role: true } },
      },
    });
  }

  private formatFullName(firstName?: string | null, lastName?: string | null) {
    return `${firstName ?? ''} ${lastName ?? ''}`.trim() || null;
  }

  async login(email: string, password: string) {
    const { data, error } = await this.anonClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user || !data.session) {
      this.logger.warn(
        `Login failed for ${email}: ${error?.message ?? 'no session'}`,
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    const summary = await this.getProfileSummary(data.user.id);
    const fullName =
      summary.firstName || summary.lastName
        ? `${summary.firstName ?? ''} ${summary.lastName ?? ''}`.trim()
        : null;

    const needsPasswordChange = Boolean(
      (data.user.user_metadata as Record<string, unknown> | null | undefined)?.[
        'needs_password_change'
      ],
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

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const { data, error } = await this.anonClient.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session || !data.user) {
      this.logger.warn(
        `Token refresh failed: ${error?.message ?? 'no session'}`,
      );
      throw new UnauthorizedException('Session expired. Please sign in again.');
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

  async requestPasswordReset(email: string) {
    const redirectTo = `${this.publicSiteUrl.replace(/\/$/, '')}/change-password`;
    const { error } = await this.anonClient.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      // Log but do not leak. Rate-limit failures from Supabase land here too.
      this.logger.warn(`Password reset request for ${email}: ${error.message}`);
    }
    return {
      success: true,
      message:
        'If an account exists for that email, a reset link has been sent.',
    };
  }

  async changePassword(authorization: string | undefined, password: string) {
    const accessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';
    if (!accessToken)
      throw new UnauthorizedException('Access token is required');

    const { data: userData, error: userError } =
      await this.anonClient.auth.getUser(accessToken);
    if (userError || !userData?.user) {
      this.logger.warn(
        `Password change rejected — invalid token: ${userError?.message ?? 'no user'}`,
      );
      throw new UnauthorizedException(
        'Your session is no longer valid. Please sign in again.',
      );
    }
    const userId = userData.user.id;
    const currentMetadata =
      (userData.user.user_metadata as
        | Record<string, unknown>
        | null
        | undefined) ?? {};

    // Step 2: admin updateUserById is the reliable write path. Merge metadata
    // explicitly because admin.updateUserById replaces (not merges) user_metadata.
    let admin: SupabaseClient;
    try {
      admin = this.createAdminClient();
    } catch (err) {
      this.logger.error(
        `Admin client unavailable for password change: ${(err as Error).message}`,
      );
      throw new UnauthorizedException(
        'Password changes are not configured on this server. Contact an admin.',
      );
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(
      userId,
      {
        password,
        user_metadata: {
          ...currentMetadata,
          needs_password_change: false,
        },
      },
    );
    if (updateError) {
      this.logger.warn(
        `Password change failed for ${userId}: ${updateError.message}`,
      );
      throw new UnauthorizedException(
        updateError.message || 'Could not update password',
      );
    }

    this.logger.log(`Password changed for ${userData.user.email ?? userId}`);
    return { success: true, message: 'Password updated successfully' };
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
            weddingAnniversary: true,
            gender: true,
            instagram: true,
            facebook: true,
            twitter: true,
            linkedin: true,
            tiktok: true,
            bio: true,
            photoUrl: true,
            joinedAt: true,
            tags: true,
            Household: { select: { name: true } },
            UnitMember: {
              select: {
                isLead: true,
                isAssistant: true,
                Unit: { select: { id: true, name: true, description: true } },
              },
            },
          },
        },
      },
    });

    if (!profile) {
      // Authenticated Supabase user with no Profile row yet — orphan account.
      // Return enough for the UI to render a "complete your profile" state.
      return { profileId: null, role: null, tenantId: null, member: null };
    }

    // Gender is editable directly on Member now, but members converted from the
    // public first-timer form may only have it on their original Visitor row.
    // Prefer Member.gender; fall back to the Visitor record by email/phone so
    // older converted members still see a value without re-asking.
    let gender = profile.Member?.gender ?? null;
    if (!gender && profile.Member && (profile.Member.email || profile.Member.phone)) {
      const visitor = await this.prisma.visitor.findFirst({
        where: {
          tenantId: profile.tenantId,
          OR: [
            profile.Member.email ? { email: profile.Member.email } : undefined,
            profile.Member.phone ? { phone: profile.Member.phone } : undefined,
          ].filter(Boolean) as Array<{ email: string } | { phone: string }>,
        },
        select: { gender: true },
      });
      gender = visitor?.gender ?? null;
    }

    const {
      Household,
      UnitMember,
      dateOfBirth,
      weddingAnniversary,
      joinedAt,
      gender: _g,
      ...rest
    } = profile.Member ?? {};

    return {
      profileId: profile.id,
      role: profile.role,
      tenantId: profile.tenantId,
      member: profile.Member
        ? {
            ...rest,
            dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
            weddingAnniversary: weddingAnniversary
              ? weddingAnniversary.toISOString()
              : null,
            joinedAt: joinedAt!.toISOString(),
            household: Household?.name ?? null,
            gender,
            units: (UnitMember ?? []).map((um) => ({
              id: um.Unit.id,
              name: um.Unit.name,
              description: um.Unit.description,
              isLead: um.isLead,
              isAssistant: um.isAssistant,
            })),
          }
        : null,
    };
  }
}
