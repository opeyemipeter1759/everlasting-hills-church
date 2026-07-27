import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
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
      ? (await this.effectiveRoles.getEffectiveRoles(member.Profile.id)).primaryRole
      : Role.MEMBER;
    if (!canActOnRole(actor.role as any, targetRole as any)) {
      throw new ForbiddenException(
        `Your role (${actor.role ?? 'none'}) cannot delete a ${targetRole}.`,
      );
    }

    const profileId = member.Profile?.id;
    const supabaseUserId = member.Profile?.userId;

    await this.prisma.$transaction(async (tx) => {
      // Children that reference Member.id (schema declares no onDelete cascades, so
      // we delete them explicitly). Keep this list in sync with members of the Member
      // model in schema.prisma.
      await tx.careAssignment.deleteMany({
        where: { OR: [{ memberId }, { leaderId: memberId }] },
      });
      await tx.attendanceRecord.deleteMany({ where: { memberId } });
      await tx.discussionResponse.deleteMany({ where: { memberId } });
      await tx.engagementScore.deleteMany({ where: { memberId } });
      await tx.followUpTask.deleteMany({ where: { memberId } });
      await tx.listenProgress.deleteMany({ where: { memberId } });
      await tx.pastorNote.deleteMany({ where: { memberId } });
      await tx.pastoralAlert.deleteMany({ where: { memberId } });
      await tx.sermonBookmark.deleteMany({ where: { memberId } });
      await tx.sermonNote.deleteMany({ where: { memberId } });
      await tx.sermonReaction.deleteMany({ where: { memberId } });
      await tx.unitMember.deleteMany({ where: { memberId } });

      await tx.member.delete({ where: { id: memberId } });

      if (profileId) {
        await tx.roleAssignment.deleteMany({ where: { profileId } });
        await tx.profile.delete({ where: { id: profileId } });
      }
    });

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
