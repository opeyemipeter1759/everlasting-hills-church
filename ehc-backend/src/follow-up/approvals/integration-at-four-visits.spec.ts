import { BadRequestException } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';

const config = { get: () => 'tenant' } as never;
const row = (visitorId: string, visits: number, assigneeId: string | null = 'm-bola', statusOverride: string | null = null) => ({ visitorId, visits, assigneeId, statusOverride });

function setup(rows: ReturnType<typeof row>[], askedBefore: string[] = []) {
  const prisma = {
    approvalRequest: { findMany: jest.fn().mockResolvedValue(askedBefore.map((subjectId) => ({ subjectId }))) },
    member: { findFirst: jest.fn().mockResolvedValue({ profileId: 'p-bola' }) },
  };
  const pipeline = { list: jest.fn().mockResolvedValue({ rows, total: rows.length }) };
  const svc = new ApprovalsService(prisma as never, {} as never, pipeline as never, {} as never, config);
  const raise = jest.spyOn(svc as never, 'raiseIntegration' as never).mockResolvedValue(undefined as never);
  return { svc, raise, pipeline };
}

describe('A fourth visit puts a first-timer forward for integration', () => {
  it('asks once, on their assignee’s behalf, for every Fourth timer, by visits or set by hand', async () => {
    const { svc, raise, pipeline } = setup([row('v4', 4), row('v5', 5), row('v-hand', 2, 'm-bola', 'FOURTH_TIMER')]);
    expect(await svc.requestAtFourVisits()).toBe(3);
    expect(pipeline.list).toHaveBeenCalledWith(expect.objectContaining({ status: 'FOURTH_TIMER' }));
    expect(raise).toHaveBeenCalledWith('v4', 'p-bola', 'Came 4 times');
    expect(raise).toHaveBeenCalledWith('v5', 'p-bola', 'Came 5 times');
    expect(raise).toHaveBeenCalledWith('v-hand', 'p-bola', 'Set to Fourth timer');
  });

  it('leaves anyone with nobody assigned, or already asked about, to the team', async () => {
    const { svc, raise } = setup([row('v-none', 4, null), row('v-asked', 4)], ['v-asked']);
    expect(await svc.requestAtFourVisits()).toBe(0);
    expect(raise).not.toHaveBeenCalled();
  });

  it('skips someone who is not ready after all, without stopping the rest', async () => {
    const { svc, raise } = setup([row('v-out', 4), row('v-ok', 4)]);
    raise.mockRejectedValueOnce(new BadRequestException('They have opted out') as never);
    expect(await svc.requestAtFourVisits()).toBe(1);
  });
});
