import { UnauthorizedException } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';

/**
 * A Profile without a Member row is not governed by membership status. Once a
 * Member row exists, ACTIVE is the only state that grants account access.
 * Legacy states (TRANSFERRED, DECEASED and OPTED_OUT) are all treated as the
 * same non-active/left state at the authentication boundary.
 */
export function isMemberAccountInactive(status: MemberStatus | string | null | undefined): boolean {
  return status != null && status !== MemberStatus.ACTIVE;
}

export const INACTIVE_MEMBER_MESSAGE =
  'This membership is non-active. Contact a church administrator to restore access.';

export function assertActiveMemberAccount(status: MemberStatus | string | null | undefined): void {
  if (isMemberAccountInactive(status)) {
    throw new UnauthorizedException(INACTIVE_MEMBER_MESSAGE);
  }
}
