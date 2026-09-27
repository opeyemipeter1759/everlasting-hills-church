import { FollowUpCountsService } from './follow-up-counts.service';
import type { FollowUpRollService, RollRow } from './follow-up-roll.service';
import type { AuthUser } from '../../auth/types/auth-user';

function row(over: Partial<RollRow>): RollRow {
  return {
    id: 'x',
    kind: 'MEMBER',
    name: 'Someone',
    photoUrl: null,
    assignedTo: null,
    integrationAssignedTo: null,
    status: 'FIRST_TIMER',
    statusAwaitingApproval: null,
    hasAccount: true,
    attended: 0,
    since: '2026-01-01T00:00:00.000Z',
    latestEntryAt: null,
    ...over,
  };
}

function makeService(rows: RollRow[]) {
  const roll = { everyone: jest.fn().mockResolvedValue(rows) } as unknown as FollowUpRollService;
  return new FollowUpCountsService(roll);
}

const viewer = { memberId: 'me' } as AuthUser;

describe('FollowUpCountsService', () => {
  it('counts the agreed status, so somebody set to Integrated is counted as integrated', async () => {
    const service = makeService([
      row({ id: '1', status: 'INTEGRATED' }),
      row({ id: '2', status: 'INTEGRATED', kind: 'VISITOR', hasAccount: false }),
      row({ id: '3', status: 'FIRST_TIMER' }),
      row({ id: '4', status: 'OPTED_OUT' }),
    ]);

    const counts = await service.summary(viewer);

    expect(counts.byStatus.INTEGRATED).toBe(2);
    expect(counts.byStatus.FIRST_TIMER).toBe(1);
    expect(counts.byStatus.OPTED_OUT).toBe(1);
    expect(counts.byStatus.AWAY).toBe(0);
    expect(counts.total).toBe(4);
  });

  it('counts a caseload against whoever is asking, and nobody else', async () => {
    const service = makeService([
      row({ id: '1', assignedTo: { id: 'me', name: 'Me' } }),
      row({ id: '2', assignedTo: { id: 'someone-else', name: 'Ruth' } }),
      row({ id: '3' }),
    ]);

    const counts = await service.summary(viewer);

    expect(counts.assignedToMe).toBe(1);
    expect(counts.unassigned).toBe(1);
  });

  it('claims nothing for an account with no member record behind it', async () => {
    const service = makeService([row({ assignedTo: { id: 'me', name: 'Me' } })]);

    const counts = await service.summary({ memberId: null } as AuthUser);

    expect(counts.assignedToMe).toBe(0);
  });

  it("counts each board's Assigned to me the way its tab lists it", async () => {
    const me = { id: 'me', name: 'Me' };
    const service = makeService([
      row({ id: '1', status: 'FIRST_TIMER', assignedTo: me }),
      row({ id: '2', status: 'OPTED_OUT', assignedTo: me }), // on the Opted out tab now
      row({ id: '3', status: 'INTEGRATED', assignedTo: me }), // Follow Up's work is done
      row({ id: '4', status: 'INTEGRATED', integrationAssignedTo: me }),
      row({ id: '5', status: 'AWAY', integrationAssignedTo: me }),
      row({ id: '6', status: 'OPTED_OUT', integrationAssignedTo: me }),
    ]);

    const counts = await service.summary(viewer);

    expect(counts.assignedToMe).toBe(1);
    expect(counts.integrationAssignedToMe).toBe(2);
    expect(counts.byStatus.OPTED_OUT).toBe(2);
  });
});
