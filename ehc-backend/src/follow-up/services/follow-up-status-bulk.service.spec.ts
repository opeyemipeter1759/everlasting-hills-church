import { ForbiddenException } from '@nestjs/common';
import { FollowUpStatusBulkService } from './follow-up-status-bulk.service';
import type { FollowUpStatusService } from './follow-up-status.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../auth/types/auth-user';

/** Setting many people's status at once is a leader's act, so the guard matters. */
function makeService(canDecide: boolean) {
  const createMany = jest.fn().mockResolvedValue({ count: 0 });
  const prisma = { followUpStatusChange: { createMany } } as unknown as PrismaService;
  const status = { canDecide: jest.fn().mockResolvedValue(canDecide) } as unknown as FollowUpStatusService;
  const config = { get: () => 't1' } as never;
  return { service: new FollowUpStatusBulkService(prisma, status, config), createMany };
}

const leader = { profileId: 'p-lead' } as AuthUser;

const subjects = [
  { subjectKind: 'VISITOR', subjectId: 'v-1', fromStatus: 'FIRST_TIMER' },
  { subjectKind: 'MEMBER', subjectId: 'm-1', fromStatus: 'SECOND_TIMER' },
];

describe('FollowUpStatusBulkService', () => {
  it('writes one approved change per person, decided by the leader doing it', async () => {
    const { service, createMany } = makeService(true);

    await expect(service.apply(leader, { subjects, toStatus: 'INTEGRATED', note: 'Joined a unit' }))
      .resolves.toEqual({ changed: 2 });

    const rows = createMany.mock.calls[0][0].data;
    expect(rows).toHaveLength(2);
    expect(rows.every((row: { state: string }) => row.state === 'APPROVED')).toBe(true);
    expect(rows[0]).toMatchObject({
      tenantId: 't1',
      subjectKind: 'VISITOR',
      subjectId: 'v-1',
      fromStatus: 'FIRST_TIMER',
      toStatus: 'INTEGRATED',
      note: 'Joined a unit',
      requestedById: 'p-lead',
      decidedById: 'p-lead',
    });
  });

  it('leaves out anyone already on that status, and writes nothing if that is everyone', async () => {
    const { service, createMany } = makeService(true);

    await expect(service.apply(leader, { subjects, toStatus: 'FIRST_TIMER' })).resolves.toEqual({ changed: 1 });
    expect(createMany.mock.calls[0][0].data[0].subjectId).toBe('m-1');

    createMany.mockClear();
    const same = [{ subjectKind: 'MEMBER', subjectId: 'm-1', fromStatus: 'AWAY' }];
    await expect(service.apply(leader, { subjects: same, toStatus: 'AWAY' })).resolves.toEqual({ changed: 0 });
    expect(createMany).not.toHaveBeenCalled();
  });

  it('refuses anyone who cannot approve a status change', async () => {
    const { service, createMany } = makeService(false);

    await expect(service.apply(leader, { subjects, toStatus: 'AWAY' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(createMany).not.toHaveBeenCalled();
  });

  it('refuses an account with no profile behind it', async () => {
    const { service } = makeService(true);
    const stranger = { profileId: null } as unknown as AuthUser;

    await expect(service.apply(stranger, { subjects, toStatus: 'AWAY' })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
