import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { UsersAuthService } from './users-auth.service';
import { UsersSupabaseAdminService } from './users-supabase-admin.service';

/**
 * Permanently delete a user. Mirrors MemberDeletionService:
 *   1. Authorize via role hierarchy (actor must out-rank target).
 *   2. Inside a transaction: remove every record that references the Member,
 *      then the Member, then RoleAssignments + Profile.
 *   3. Best-effort delete the Supabase auth user — failure here just leaves an
 *      orphan auth user (logged for manual cleanup) so the DB delete is not undone.
 *
 * Why hard delete: the admins reported that soft-deleted users still appeared in
 * Supabase Auth and could re-login if anyone flipped their status. "Delete" now
 * means "gone everywhere".
 */
@Injectable()
export class UsersDeletionService {
  private readonly logger = new Logger(UsersDeletionService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: UsersAuthService,
    private readonly supabaseAdmin: UsersSupabaseAdminService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async deleteUser(actor: AuthUser, profileId: string) {
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        Member: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!target || target.tenantId !== this.tenantId) {
      throw new NotFoundException('User not found');
    }
    this.auth.assertCanActOn(actor, await this.auth.targetPrimaryRole(profileId));

    const memberId = target.Member?.id;

    await this.prisma.$transaction(async (tx) => {
      if (memberId) {
        // Keep this list in sync with relations on the Member model in schema.prisma.
        await tx.careAssignment.deleteMany({ where: { OR: [{ memberId }, { leaderId: memberId }] } });
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
      }
      await tx.roleAssignment.deleteMany({ where: { profileId } });
      await tx.profile.delete({ where: { id: profileId } });
    });

    try {
      const { error } = await this.supabaseAdmin.getClient().auth.admin.deleteUser(target.userId);
      if (error) {
        this.logger.warn(
          `User ${profileId} removed from DB but Supabase auth user ${target.userId} could not be deleted: ${error.message}`,
        );
      }
    } catch (err) {
      this.logger.warn(`User ${profileId} removed but Supabase admin client failed: ${(err as Error).message}`);
    }

    const name = target.Member ? `${target.Member.firstName} ${target.Member.lastName}`.trim() : target.userId;
    this.logger.log(`[${actor.email}] permanently deleted user ${name} (${target.Member?.email ?? 'no email'})`);

    return { success: true, deletedProfileId: profileId };
  }
}
