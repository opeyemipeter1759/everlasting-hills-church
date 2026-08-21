import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { generateTempPassword, passwordSetupRedirect } from '../../auth/secure-provisioning';
import type { Env } from '../../config/env.validation';
import { PrismaService } from '../../prisma/prisma.service';
import { createAdminClient } from '../members-supabase-admin.util';

export interface ProvisionedAuthUser {
  userId: string;
  /** True only when this operation created the Supabase identity. */
  created: boolean;
  /** Real, usable temporary password — emailed to the new member so they can
   * log in directly. Paired with needs_password_change: true, which forces a
   * real password to be chosen immediately on first login. */
  tempPassword: string;
}

/** Creates or safely links the Supabase identity backing a converted member. */
@Injectable()
export class MemberAuthProvisioningService {
  private readonly logger = new Logger(MemberAuthProvisioningService.name);
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.appUrl = config.get('FRONTEND_URL', { infer: true }) ?? 'http://localhost:3000';
  }

  /** `password`, when supplied, is used as-is as the account's temp password
   * (e.g. the visitor's phone number) instead of a randomly generated one.
   * Falls back to a random one if omitted or too short for Supabase's minimum
   * password length. */
  async createOrReuseAuthUser(email: string, password?: string): Promise<ProvisionedAuthUser> {
    const supabase = createAdminClient();
    const tempPassword = password && password.trim().length >= 6 ? password.trim() : generateTempPassword();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      app_metadata: { role: Role.MEMBER },
      user_metadata: {
        needs_password_change: true,
        provisioned_by: 'member-onboarding',
      },
    } as any);

    if (!authError && authData.user) {
      return { userId: authData.user.id, created: true, tempPassword };
    }

    const isDuplicate = /already.*registered|already.*exists/i.test(authError?.message ?? '');
    if (!isDuplicate) {
      throw new InternalServerErrorException(
        `Could not create auth account: ${authError?.message ?? 'unknown error'}`,
      );
    }

    const { data: list, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listError) {
      throw new InternalServerErrorException(
        `Auth user exists but could not be looked up: ${listError.message}`,
      );
    }
    const found = list.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (!found) {
      throw new InternalServerErrorException(
        'Auth user reported as duplicate but could not be located',
      );
    }

    // Check application ownership before *any* mutation to an existing identity.
    // A duplicate address can belong to a privileged or unrelated account.
    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId: found.id },
      select: { id: true },
    });
    if (existingProfile) {
      throw new ConflictException(
        'This person already has an account. Their Member record may have been removed - restore it instead of creating a new one.',
      );
    }

    // The identity is an orphan from an interrupted legacy flow — reused rather
    // than recreated. We don't know its existing password (it may be an old
    // generateUnusableInitialPassword() blob), so the same resolved temp
    // password is (re)set here too; that's the only field touched —
    // confirmation state, role, and other metadata are left as-is.
    const { error: updateError } = await supabase.auth.admin.updateUserById(found.id, {
      password: tempPassword,
      user_metadata: { ...found.user_metadata, needs_password_change: true },
    });
    if (updateError) {
      throw new InternalServerErrorException(
        `Could not set a temporary password for the existing identity: ${updateError.message}`,
      );
    }

    return { userId: found.id, created: false, tempPassword };
  }

  async sendPasswordSetupEmail(email: string): Promise<boolean> {
    const { error } = await createAdminClient().auth.resetPasswordForEmail(email, {
      redirectTo: passwordSetupRedirect(this.appUrl),
    });
    if (error) {
      this.logger.error(`Could not send password setup email to ${email}: ${error.message}`);
      return false;
    }
    return true;
  }

  async rollbackCreatedAuthUser(userId: string): Promise<void> {
    const { error } = await createAdminClient().auth.admin.deleteUser(userId);
    if (error) {
      this.logger.error(`Could not roll back newly-created auth user ${userId}: ${error.message}`);
    }
  }
}
