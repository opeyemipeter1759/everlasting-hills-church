import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;
  private readonly supabaseServiceRoleKey: string;
  private readonly defaultSuperAdminEmail?: string;
  private readonly defaultSuperAdminPassword?: string;
  private readonly anonClient: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.supabaseUrl = config.get('SUPABASE_URL', { infer: true });
    this.supabaseAnonKey = config.get('SUPABASE_ANON_KEY', { infer: true });
    this.supabaseServiceRoleKey = config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true });
    this.defaultSuperAdminEmail = config.get('DEFAULT_SUPER_ADMIN_EMAIL', { infer: true });
    this.defaultSuperAdminPassword = config.get('DEFAULT_SUPER_ADMIN_PASSWORD', { infer: true });
    this.anonClient = createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async onModuleInit() {
    await this.ensureDefaultSuperAdmin();
  }

  private createAdminClient() {
    if (!this.supabaseServiceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY must be set for admin actions');
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

    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) {
      throw new Error(`Could not list Supabase users: ${error.message}`);
    }

    const existingUser = data.users.find((user) => user.email?.toLowerCase() === email) ?? null;

    let userId = existingUser?.id ?? null;
    if (existingUser) {
      const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, {
        password: this.defaultSuperAdminPassword,
        email_confirm: true,
        user_metadata: {
          ...(existingUser.user_metadata ?? {}),
          role: Role.SUPER_ADMIN,
          full_name: 'Super Admin',
        },
      });

      if (updateError) {
        throw new Error(`Could not update default super admin: ${updateError.message}`);
      }

      userId = updated.user.id;
    } else {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: this.defaultSuperAdminPassword,
        email_confirm: true,
        user_metadata: { role: Role.SUPER_ADMIN, full_name: 'Super Admin' },
      });

      if (createError || !created.user) {
        throw new Error(`Could not create default super admin: ${createError?.message ?? 'unknown error'}`);
      }

      userId = created.user.id;
    }

    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: {
        id: randomUUID(),
        userId,
        tenantId: TENANT_ID,
        role: Role.SUPER_ADMIN,
      },
      update: {
        tenantId: TENANT_ID,
        role: Role.SUPER_ADMIN,
      },
    });

    await this.prisma.member.upsert({
      where: { profileId: profile.id },
      create: {
        id: randomUUID(),
        tenantId: TENANT_ID,
        profileId: profile.id,
        firstName: 'Super',
        lastName: 'Admin',
        email,
        phone: null,
      },
      update: {
        tenantId: TENANT_ID,
        firstName: 'Super',
        lastName: 'Admin',
        email,
      },
    });

    this.logger.log(`Default super admin ready: ${email}`);
  }

  /**
   * Look up the application role for an authenticated Supabase user.
   * Returns null if the user has signed up but has no Profile yet.
   */
  private async getMemberRole(email: string): Promise<string | null> {
    const member = await this.prisma.member.findFirst({
      where: { email },
      select: { Profile: { select: { role: true } } },
    });
    return member?.Profile?.role ?? null;
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

    const userEmail = String(data.user.email ?? '');
    const memberInfo = userEmail ? await this.getMemberByEmail(userEmail) : null;
    const role = memberInfo?.Profile?.role ?? null;
    const metadata = (data.user.user_metadata ?? {}) as Record<string, unknown>;
    const fullName = (
      this.formatFullName(memberInfo?.firstName, memberInfo?.lastName) ??
      String(metadata.full_name ?? metadata.name ?? '').trim()
    ) || null;
    const picture = (
      memberInfo?.photoUrl ??
      String(metadata.avatar_url ?? metadata.picture ?? '').trim()
    ) || null;

    return {
      access_token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        fullName,
        picture,
      },
      //session: { access_token: data.session.access_token, expires_in: data.session.expires_in, token_type: data.session.token_type },
    };
  }

  async logout(authorization?: string) {
    const accessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';
    if (!accessToken)
      throw new UnauthorizedException('Access token is required');

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

  async getProfile(authorization?: string) {
    const accessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';
    if (!accessToken)
      throw new UnauthorizedException('Access token is required');

    const supabase = createClient(this.supabaseUrl, this.supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      this.logger.warn('Supabase getUser error: ' + error.message);
      throw new UnauthorizedException('Invalid access token');
    }
    const user = data?.user;
    if (!user) throw new UnauthorizedException('User not found');

    const userEmail = String(user.email ?? '');
    const memberInfo = userEmail
      ? await this.getMemberByEmail(userEmail)
      : null;
    const role = memberInfo?.Profile?.role ?? null;
    const fullName = this.formatFullName(
      memberInfo?.firstName,
      memberInfo?.lastName,
    );
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const fallbackPicture =
      String(
        metadata.avatar_url ??
          metadata.picture ??
          (user as any).avatar_url ??
          (user as any).picture ??
          '',
      ).trim() || null;
    const picture = memberInfo?.photoUrl ?? fallbackPicture;

    return { id: user.id, email: user.email, role, fullName, picture };
  }
}
