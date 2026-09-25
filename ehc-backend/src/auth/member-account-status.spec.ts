import { UnauthorizedException } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';
import { assertActiveMemberAccount, isMemberAccountInactive } from './member-account-status';

describe('member account status', () => {
  it('allows active members and profiles without a Member row', () => {
    expect(isMemberAccountInactive(MemberStatus.ACTIVE)).toBe(false);
    expect(isMemberAccountInactive(null)).toBe(false);
    expect(() => assertActiveMemberAccount(MemberStatus.ACTIVE)).not.toThrow();
  });

  it.each([
    MemberStatus.INACTIVE,
    MemberStatus.TRANSFERRED,
    MemberStatus.DECEASED,
    MemberStatus.OPTED_OUT,
  ])('blocks the non-active status %s', (status) => {
    expect(isMemberAccountInactive(status)).toBe(true);
    expect(() => assertActiveMemberAccount(status)).toThrow(UnauthorizedException);
  });
});
