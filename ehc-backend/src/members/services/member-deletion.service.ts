import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { deletePersonRecords } from '../../common/person-deletion.util';
import { EffectiveRolesService } from '../../auth/effective-roles.service';
import { canActOnRole } from '../../users/role-hierarchy';
import { createAdminClient } from '../members-supabase-admin.util';

/** Permanently removes a member: DB row + all owned child records + their Supabase auth user. */
@Injectable()
export class MemberDeletionService {
  private readonly logger = new Logger(MemberDeletionService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly effectiveRoles: EffectiveRolesService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async deleteMember(actor: AuthUser, memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        tenantId: true,
        firstName: true,
        lastName: true,
        email: true,
        Profile: { select: { id: true, userId: true } },
      },
    });
    if (!member || member.tenantId !== this.tenantId) {
      throw new NotFoundException('Member not found');
    }

    const targetRole = member.Profile
      ? (await this.effectiveRoles.getEffectiveRoles(member.Profile.id))
          .primaryRole
      : Role.MEMBER;
    if (!canActOnRole(actor.role, targetRole)) {
      throw new ForbiddenException(
        `Your role (${actor.role ?? 'none'}) cannot delete a ${targetRole}.`,
      );
    }

    const profileId = member.Profile?.id;
    const supabaseUserId = member.Profile?.userId;

    await this.prisma.$transaction(
      (tx) => deletePersonRecords(tx, { memberId, profileId }),
      { timeout: 30_000 },
    );

    if (supabaseUserId) {
      try {
        const supabase = createAdminClient();
        const { error } = await supabase.auth.admin.deleteUser(supabaseUserId);
        if (error) {
          this.logger.warn(
            `Member ${memberId} removed from DB but Supabase user ${supabaseUserId} could not be deleted: ${error.message}`,
          );
        }
      } catch (err) {
        this.logger.warn(
          `Member ${memberId} removed but Supabase admin client failed: ${(err as Error).message}`,
        );
      }
    }

    this.logger.log(
      `[${actor.email}] deleted member ${member.firstName} ${member.lastName} (${member.email ?? 'no email'})`,
    );

    return { success: true, deletedId: memberId };
  }
}
