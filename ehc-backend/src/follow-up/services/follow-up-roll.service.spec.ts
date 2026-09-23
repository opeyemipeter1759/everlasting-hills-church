import { FollowUpRollService } from './follow-up-roll.service';
import type { FollowUpStatusService } from './follow-up-status.service';
import type { PrismaService } from '../../prisma/prisma.service';
import * as queries from './master-list-queries';
import type { MasterListRow } from './master-list.util';

function row(over: Partial<MasterListRow>): MasterListRow {
  return {
    id: 'm-1',
    kind: 'MEMBER',
    name: 'Grace',
    photoUrl: null,
    assignedTo: null,
    status: 'AWAY',
    hasAccount: true,
    attended: 6,
    since: '2026-01-01T00:00:00.000Z',
    latestEntryAt: null,
    ...over,
  };
}

function makeService(member: MasterListRow, agreedAt: Date | null) {
  jest.spyOn(queries, 'fetchVisitorRows').mockResolvedValue([]);
  jest.spyOn(queries, 'fetchMemberRows').mockResolvedValue([member]);

  const approved = new Map(agreedAt ? [[member.id, { status: 'INTEGRATED' as const, at: agreedAt }]] : []);
  const status = {
    approvedFor: jest.fn(async (kind: string) => (kind === 'MEMBER' ? approved : new Map())),
    pendingFor: jest.fn(async () => new Map()),
  } as unknown as FollowUpStatusService;

  const prisma = {} as PrismaService;
  return new FollowUpRollService(prisma, status, { get: () => 't1' } as never);
}

afterEach(() => jest.restoreAllMocks());

describe('FollowUpRollService', () => {
  it('lets a status the team agreed beat the one worked out from attendance', async () => {
    const service = makeService(row({ latestEntryAt: null }), new Date('2026-05-01'));

    const [person] = await service.everyone();

    expect(person.status).toBe('INTEGRATED');
  });

  it('gives way to what has happened since — somebody integrated who stops coming is away again', async () => {
    const stoppedComing = row({ latestEntryAt: '2026-06-01T00:00:00.000Z' });
    const service = makeService(stoppedComing, new Date('2026-05-01'));

    const [person] = await service.everyone();

    expect(person.status).toBe('AWAY');
  });

  it('keeps the agreed status when the team had the last word', async () => {
    const service = makeService(row({ latestEntryAt: '2026-04-01T00:00:00.000Z' }), new Date('2026-05-01'));

    const [person] = await service.everyone();

    expect(person.status).toBe('INTEGRATED');
  });
});
