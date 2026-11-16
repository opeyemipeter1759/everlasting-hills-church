import { FollowUpCountsService } from './follow-up-counts.service';
import type { FollowUpRollService, RollRow } from './follow-up-roll.service';
import type { FollowUpNoteActivityService } from './follow-up-note-activity.service';
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

function makeService(rows: RollRow[], activeThreads: string[] = []) {
  const roll = { everyone: jest.fn().mockResolvedValue(rows) } as unknown as FollowUpRollService;
  const activity = { activeSince: jest.fn().mockResolvedValue(new Set(activeThreads)) } as unknown as FollowUpNoteActivityService;
  const prisma = {
    visitor: { count: jest.fn().mockResolvedValue(3), findMany: jest.fn().mockResolvedValue([{ convertedToMemberId: 'm1' }]) },
    member: { findMany: jest.fn().mockResolvedValue([{ id: 'm1' }]) },
  };
  return new FollowUpCountsService(roll, activity, prisma as never, { get: () => 't1' } as never);
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

  it("sums up Follow Up's own list: who is new, who nobody carries, who has gone quiet", async () => {
    const now = new Date('2026-11-16T09:00:00Z');
    const ruth = { id: 'ruth', name: 'Ruth' };
    const service = makeService(
      [
        row({ id: '1', kind: 'VISITOR', since: '2026-11-15T10:00:00Z', assignedTo: ruth }), // new, talked to
        row({ id: '2', status: 'AWAY', assignedTo: ruth }), // quiet
        row({ id: '3', status: 'THIRD_TIMER' }), // nobody carries them, and quiet
        row({ id: '4', status: 'INTEGRATED', since: '2026-11-15T10:00:00Z' }), // not Follow Up's any more
        row({ id: '5', status: 'OPTED_OUT' }),
      ],
      ['VISITOR:1', 'MEMBER:4'],
    );

    const counts = await service.summary(viewer, now);

    expect(counts.followUp).toEqual({ newThisWeek: 1, unassigned: 1, quiet: 2 });
  });

  it('gives the same first-timer total the admin First Timers page shows', async () => {
    const counts = await makeService([]).summary(viewer);
    expect(counts.visitors).toBe(3);
  });
});
