import { MemberStatus } from '@prisma/client';
import { memberStatusFor, type MasterListRow } from './master-list.util';
import { settle } from './roll-settle.util';

const row = (o: Partial<MasterListRow>): MasterListRow => ({
  id: 'm1',
  kind: 'MEMBER',
  name: 'Marvel Angulu',
  photoUrl: null,
  assignedTo: null,
  integrationAssignedTo: null,
  status: 'INTEGRATED',
  hasAccount: true,
  attended: 4,
  since: '2026-09-01T00:00:00.000Z',
  latestEntryAt: null,
  ...o,
});

const agreedIntegrated = new Map([['m1', { status: 'INTEGRATED' as const, at: new Date('2026-10-01T00:00:00Z') }]]);

describe('deactivated members on the follow-up roll', () => {
  it('reads a deactivated or opted-out account as opted out, however often they came', () => {
    expect(memberStatusFor(MemberStatus.INACTIVE, 9, null, 'WANT_TO_BE_MEMBER')).toBe('OPTED_OUT');
    expect(memberStatusFor(MemberStatus.OPTED_OUT, 0, 'ABSENTEE', null)).toBe('OPTED_OUT');
    expect(memberStatusFor(MemberStatus.ACTIVE, 4, null, null)).toBe('INTEGRATED');
  });

  it('keeps them opted out even when the team had agreed they were integrated', () => {
    const [settled] = settle([row({ status: 'OPTED_OUT' })], agreedIntegrated, new Map());
    expect(settled.status).toBe('OPTED_OUT');
  });

  it('still lets an agreed status stand for an active member', () => {
    const [settled] = settle([row({ status: 'AWAY' })], agreedIntegrated, new Map());
    expect(settled.status).toBe('INTEGRATED');
  });
});
