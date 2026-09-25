import { MemberStatus, Prisma } from '@prisma/client';

/**
 * Deactivating somebody removes them from the membership, so "how many members
 * do we have" and "who are our members" must both mean ACTIVE only. They are
 * not deleted — they move to the deactivated feed (`status=INACTIVE` on the
 * People directory), which is the one place that deliberately looks past this.
 *
 * Non-active is a single idea here: INACTIVE plus the legacy TRANSFERRED,
 * DECEASED and OPTED_OUT rows, matching how the auth boundary reads them.
 */
export const ACTIVE_MEMBER: Pick<Prisma.MemberWhereInput, 'status'> = {
  status: MemberStatus.ACTIVE,
};

export const DEACTIVATED_MEMBER: Pick<Prisma.MemberWhereInput, 'status'> = {
  status: { not: MemberStatus.ACTIVE },
};

/** Tenant-scoped active-member filter — the shape nearly every count needs. */
export function activeMembersOf(tenantId: string): Prisma.MemberWhereInput {
  return { tenantId, ...ACTIVE_MEMBER };
}
