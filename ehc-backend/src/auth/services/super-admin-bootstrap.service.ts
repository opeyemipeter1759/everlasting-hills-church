import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { EffectiveRolesService } from '../effective-roles.service';
import { ensureDefaultTenant } from '../../tenant/ensure-default-tenant';
import { AuthSupabaseService } from './auth-supabase.service';

/** Seeds (and keeps up to date) the default SUPER_ADMIN account from env vars, if configured. */
@Injectable()
export class SuperAdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(SuperAdminBootstrapService.name);
  private readonly defaultSuperAdminEmail: string | undefined;
  private readonly defaultSuperAdminPassword: string | undefined;
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly effectiveRoles: EffectiveRolesService,
    private readonly supabase: AuthSupabaseService,
    config: ConfigService<Env, true>,
  ) {
    this.defaultSuperAdminEmail = config.get('DEFAULT_SUPER_ADMIN_EMAIL', { infer: true }) as
      | string
      | undefined;
    this.defaultSuperAdminPassword = config.get('DEFAULT_SUPER_ADMIN_PASSWORD', { infer: true }) as
      | string
      | undefined;
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async onModuleInit() {
    try {
      await this.ensureDefaultSuperAdmin();
    } catch (err) {
      // Non-fatal: Supabase may be temporarily unreachable at startup (DNS, cold start).
      // The server continues running; the super-admin seed will be skipped this boot.
      this.logger.warn(`ensureDefaultSuperAdmin skipped: ${(err as Error).message}`);
    }
  }

  private async ensureDefaultSuperAdmin() {
    if (!this.defaultSuperAdminEmail || !this.defaultSuperAdminPassword) {
      return;
    }

    const admin = this.supabase.createAdminClient();
    const email = this.defaultSuperAdminEmail.toLowerCase();

    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) {
      throw new Error(`Could not list Supabase users: ${error.message}`);
    }

    const existingUser = data.users.find((user) => user.email?.toLowerCase() === email) ?? null;

    let userId: string;
    if (existingUser) {
      const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, {
        password: this.defaultSuperAdminPassword,
        email_confirm: true,
        app_metadata: { ...(existingUser.app_metadata ?? {}), role: Role.SUPER_ADMIN },
        user_metadata: { ...(existingUser.user_metadata ?? {}), role: Role.SUPER_ADMIN, full_name: 'Super Admin' },
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
        app_metadata: { role: Role.SUPER_ADMIN },
        user_metadata: { role: Role.SUPER_ADMIN, full_name: 'Super Admin' },
      });
      if (createError || !created.user) {
        throw new Error(`Could not create default super admin: ${createError?.message ?? 'unknown error'}`);
      }
      userId = created.user.id;
    }

    await ensureDefaultTenant(this.prisma, this.tenantId);

    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: { id: randomUUID(), userId, tenantId: this.tenantId },
      update: { tenantId: this.tenantId },
    });

    // Source of truth for the super admin's role is an active RoleGrant, not the
    // legacy column. Idempotent: only create if no active SUPER_ADMIN grant exists.
    const existingGrant = await this.prisma.roleGrant.findFirst({
      where: { userId: profile.id, role: Role.SUPER_ADMIN, endedAt: null },
      select: { id: true },
    });
    if (!existingGrant) {
      await this.prisma.roleGrant.create({
        data: { id: randomUUID(), tenantId: this.tenantId, userId: profile.id, role: Role.SUPER_ADMIN },
      });
      this.effectiveRoles.invalidate(profile.id);
    }

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
      update: { tenantId: this.tenantId, firstName: 'Super', lastName: 'Admin', email },
    });

    this.logger.log(`Default super admin ready: ${email}`);
  }
}
