import { FollowUpCountsService } from './follow-up-counts.service';
import type { FollowUpNoteActivityService } from './follow-up-note-activity.service';
import type { PipelineRepository } from '../../pipeline/pipeline.repository';
import type { PipelineFilters, PipelinePage, PipelineStatus } from '../../pipeline/pipeline.types';
import { PIPELINE_STATUSES } from '../../pipeline/pipeline.types';
import type { AuthUser } from '../../auth/types/auth-user';

interface Person {
  id: string;
  status: PipelineStatus;
  assigneeId: string | null;
}

/**
 * A stand-in pipeline that filters a fixed list the way the SQL does, and
 * returns rows, total and counts together, so the service is checked against
 * the same contract the real repository keeps.
 */
function fakePipeline(people: Person[]) {
  const list = jest.fn(async (f: PipelineFilters): Promise<PipelinePage> => {
    const matches = people.filter(
      (p) =>
        (f.assigneeId === undefined || (f.assigneeId === 'none' ? p.assigneeId === null : p.assigneeId === f.assigneeId)) &&
        (f.visitorIds === undefined || f.visitorIds.includes(p.id)),
    );
    const counts = Object.fromEntries(PIPELINE_STATUSES.map((s) => [s, matches.filter((p) => p.status === s).length]));
    const shown = matches.filter((p) => !f.status || p.status === f.status);
    return {
      rows: shown.slice(0, f.take ?? 50) as never,
      total: shown.length,
      counts: { ...(counts as Record<PipelineStatus, number>), all: matches.length },
    };
  });
  return { list } as unknown as PipelineRepository & { list: typeof list };
}

function makeService(people: Person[], opts: { weekIds?: string[]; active?: string[]; converted?: Record<string, string> } = {}) {
  const pipeline = fakePipeline(people);
  const activity = { activeSince: jest.fn().mockResolvedValue(new Set(opts.active ?? [])) } as unknown as FollowUpNoteActivityService;
  const converted = opts.converted ?? {};
  const prisma = {
    visitor: {
      findMany: jest.fn(async ({ where }: { where: { convertedToMemberId?: { in: string[] } } }) =>
        where.convertedToMemberId
          ? Object.entries(converted).filter(([, m]) => where.convertedToMemberId?.in.includes(m)).map(([id]) => ({ id }))
          : (opts.weekIds ?? []).map((id) => ({ id })),
      ),
    },
  };
  return { service: new FollowUpCountsService(pipeline, activity, prisma as never, { get: () => 't1' } as never), pipeline };
}

const viewer = { memberId: 'me' } as AuthUser;

const people: Person[] = [
  { id: 'v1', status: 'FIRST_TIMER', assigneeId: 'me' },
  { id: 'v2', status: 'FIRST_TIMER', assigneeId: null },
  { id: 'v3', status: 'SECOND_TIMER', assigneeId: 'ruth' },
  { id: 'v4', status: 'THIRD_TIMER', assigneeId: null },
  { id: 'v5', status: 'INTEGRATED', assigneeId: 'me' },
  { id: 'v6', status: 'OPTED_OUT', assigneeId: null },
];

describe('FollowUpCountsService', () => {
  it('states the pipeline counts, and its total is the sum of them', async () => {
    const { service } = makeService(people);
    const counts = await service.summary(viewer);

    expect(counts.byStatus).toEqual({ FIRST_TIMER: 2, SECOND_TIMER: 1, THIRD_TIMER: 1, INTEGRATED: 1, OPTED_OUT: 1 });
    expect(counts.total).toBe(6);
    expect(counts.total).toBe(PIPELINE_STATUSES.reduce((n, s) => n + counts.byStatus[s], 0));
    expect(counts.visitors).toBe(counts.total);
    expect(counts.followingUp).toBe(4);
    expect(Object.keys(counts.byStatus)).not.toContain('AWAY');
  });

  it('gives each tab badge the total of the very list that tab opens', async () => {
    const { service, pipeline } = makeService(people);
    const counts = await service.summary(viewer);

    const all = await pipeline.list({ take: 200 });
    const mine = await pipeline.list({ assigneeId: 'me', take: 200 });
    const optedOut = await pipeline.list({ status: 'OPTED_OUT', take: 200 });
    expect(counts.total).toBe(all.rows.length);
    expect(counts.assignedToMe).toBe(mine.rows.length);
    expect(counts.byStatus.OPTED_OUT).toBe(optedOut.rows.length);
  });

  it('counts a caseload against whoever is asking, and claims nothing for an account with no member', async () => {
    expect((await makeService(people).service.summary(viewer)).assignedToMe).toBe(2);
    expect((await makeService(people).service.summary({ memberId: null } as AuthUser)).assignedToMe).toBe(0);
  });

  it('sums up the people still being followed up: who is new, who nobody carries, who has gone quiet', async () => {
    const { service } = makeService(people, {
      weekIds: ['v1', 'v2'],
      // v1 talked about on their own thread, v3 on the thread of the account made from their form.
      active: ['VISITOR:v1', 'MEMBER:m3', 'MEMBER:someone-else'],
      converted: { v3: 'm3' },
    });
    const counts = await service.summary(viewer, new Date('2026-11-16T09:00:00Z'));

    expect(counts.followUp).toEqual({ newThisWeek: 2, unassigned: 2, quiet: 2 });
    expect(counts.unassigned).toBe(2);
  });

  it('reads every figure from the pipeline, never from rows it counts itself', async () => {
    const { service, pipeline } = makeService(people);
    await service.summary(viewer);
    for (const [filters] of pipeline.list.mock.calls) expect(filters.take).toBe(1);
  });
});
