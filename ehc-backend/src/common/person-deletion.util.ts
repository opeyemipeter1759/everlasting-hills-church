import type { Prisma } from '@prisma/client';

/** Shared by the People (/users) and member deletion endpoints, inside a transaction. */
export async function deletePersonRecords(
  tx: Prisma.TransactionClient,
  { memberId, profileId }: { memberId?: string; profileId?: string },
) {
  // Clear non-cascading foreign keys before deleting the member/profile.
  // The regression test checks this list against Prisma's relation metadata.
  if (memberId) {
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
    await tx.sermonComment.deleteMany({ where: { memberId } });

    // The member can appear on either side of these relationships.
    await tx.careAssignment.deleteMany({
      where: { OR: [{ memberId }, { leaderId: memberId }] },
    });
    await tx.birthdayGreeting.deleteMany({
      where: { OR: [{ memberId }, { authorMemberId: memberId }] },
    });
    await tx.sermonDirectMessage.deleteMany({
      where: { OR: [{ senderId: memberId }, { recipientId: memberId }] },
    });

    // Contact-log authors reference Member.id, not Profile.id.
    await tx.followUpContactLog.deleteMany({ where: { byId: memberId } });
    await tx.followUpConnection.deleteMany({
      where: { suggestedMemberId: memberId },
    });
  }

  // Remove their follow-up records and any entries they created. Entry logs
  // and suggested connections cascade; assignments on other entries set null.
  const followUpOwners = [
    ...(memberId ? [{ memberId }] : []),
    ...(profileId ? [{ addedById: profileId }] : []),
  ];
  if (followUpOwners.length) {
    await tx.followUpEntry.deleteMany({ where: { OR: followUpOwners } });
  }

  if (memberId) {
    await tx.member.delete({ where: { id: memberId } });
  }

  if (profileId) {
    // Required author references must be removed before the profile.
    // Task/report children cascade; nullable reviewer/assigner references
    // set null so unrelated records and assignments are retained.
    await tx.unitTaskComment.deleteMany({ where: { authorId: profileId } });
    await tx.reportComment.deleteMany({ where: { authorId: profileId } });
    await tx.unitTask.deleteMany({ where: { createdById: profileId } });
    await tx.unitExpense.deleteMany({ where: { createdById: profileId } });
    await tx.report.deleteMany({ where: { submittedById: profileId } });
    await tx.serviceFollowUpReport.deleteMany({
      where: { compiledById: profileId },
    });
    await tx.communityPost.deleteMany({ where: { profileId } });
    await tx.notification.deleteMany({ where: { profileId } });
    await tx.roleAssignment.deleteMany({ where: { profileId } });
    await tx.profile.delete({ where: { id: profileId } });
  }
}
