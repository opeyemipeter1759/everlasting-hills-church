import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createAdminClient } from '../members-supabase-admin.util';

/** Creates (or safely reuses) the Supabase auth user backing a newly-converted member. */
@Injectable()
export class MemberAuthProvisioningService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a Supabase auth user with `phone` as the initial password. If Supabase
   * reports the email as already registered, reuse that auth user instead of
   * failing — this makes visitor conversion idempotent against a prior attempt
   * that got past Supabase but failed before we wrote the Profile.
   */
  async createOrReuseAuthUser(email: string, phone: string): Promise<string> {
    const supabase = createAdminClient();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: phone,
      email_confirm: true,
      user_metadata: { needs_password_change: true },
    } as any);

    if (!authError) return authData.user.id;

    const isDuplicate = /already.*registered|already.*exists/i.test(authError.message);
    if (!isDuplicate) {
      throw new InternalServerErrorException(
        `Could not create auth account: ${authError.message}`,
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
    const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!found) {
      throw new InternalServerErrorException(
        'Auth user reported as duplicate but could not be located',
      );
    }

    // Re-link an orphan auth user: refresh password to the visitor's phone so the
    // admin's intent ("their initial password is their phone") holds.
    await supabase.auth.admin.updateUserById(found.id, { password: phone, email_confirm: true });

    // If a Profile already exists for this user, the visitor was effectively converted
    // before — bail out with a clear 409 so the admin knows.
    const orphanProfile = await this.prisma.profile.findUnique({ where: { userId: found.id } });
    if (orphanProfile) {
      throw new ConflictException(
        'This person already has an account. Their Member record may have been removed — restore it instead of creating a new one.',
      );
    }

    return found.id;
  }
}
