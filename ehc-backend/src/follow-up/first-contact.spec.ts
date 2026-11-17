import { FollowUpLogKind, Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';
import { FollowUpProgressService } from './services/follow-up-progress.service';

const actor: AuthUser = {
  userId: 'u-lead', email: 'lead@example.com', role: Role.UNIT_LEAD, effectiveRoles: [Role.MEMBER, Role.UNIT_LEAD],
  unitLeadOf: ['unit'], hodOf: [], headUsher: false, profileId: 'p-lead', memberId: 'm-lead', tenantId: 't',
};
const config = { get: () => 't' } as never;

/** The team's contact log, as far as the first contact goes: only the first real contact stamps it. */
function setup(o: { stage: string; firstContactedAt: Date | null }) {
  const state = { ...o };
  const entry = { id: 'e1', tenantId: 't', unitId: 'unit', assigneeId: null, memberId: null, visitorId: 'v1', sourceType: 'FIRST_TIMER', stage: o.stage };
  const history: { fromStage: string; toStage: string; reason: string }[] = [];
  const prisma: Record<string, unknown> = {
    followUpEntry: {
      findFirst: jest.fn(async () => entry),
      findFirstOrThrow: jest.fn(async () => entry),
      findUnique: jest.fn(async () => ({ stage: state.stage })),
      update: jest.fn(async ({ data }: { data: { stage?: string } }) => {
        if (data.stage) state.stage = data.stage;
        return entry;
      }),
      updateMany: jest.fn(async ({ data }: { data: { firstContactedAt: Date } }) => {
        if (state.firstContactedAt) return { count: 0 };
        state.firstContactedAt = data.firstContactedAt;
        return { count: 1 };
      }),
    },
    followUpStageHistory: { create: jest.fn(async ({ data }) => void history.push(data)) },
    followUpContactLog: { create: jest.fn(async ({ data }) => ({ ...data, isPastoralContact: false })) },
    followUpNote: { upsert: jest.fn(async () => ({})) },
  };
  prisma.$transaction = jest.fn(async (fn: (tx: unknown) => unknown) => fn(prisma));
  const svc = new FollowUpProgressService(
    prisma as never,
    { canWorkEntry: jest.fn().mockResolvedValue(true) } as never,
    { mapEntry: jest.fn(() => ({})) } as never,
    { write: jest.fn() } as never,
    {} as never,
    { onNewMessage: jest.fn() } as never,
    config,
  );
  return { svc, state, history };
}

describe('A logged contact and the first-contact time', () => {
  it('stamps the first contact and moves someone new into follow-up', async () => {
    const { svc, state, history } = setup({ stage: 'UNASSIGNED', firstContactedAt: null });
    await svc.logContact(actor, 'e1', { method: 'CALL', outcome: 'REACHED', note: 'Lovely chat' } as never);
    expect(state.firstContactedAt).toBeInstanceOf(Date);
    expect(state.stage).toBe('IN_PROGRESS');
    expect(history).toEqual([expect.objectContaining({ fromStage: 'UNASSIGNED', toStage: 'IN_PROGRESS', reason: 'CONTACTED' })]);
  });

  it('leaves an earlier first contact alone', async () => {
    const earlier = new Date('2026-11-01T10:00:00Z');
    const { svc, state } = setup({ stage: 'ASSIGNED', firstContactedAt: earlier });
    await svc.logContact(actor, 'e1', { method: 'CALL', outcome: 'REACHED', note: 'Second call' } as never);
    expect(state.firstContactedAt).toBe(earlier);
    expect(state.stage).toBe('IN_PROGRESS');
  });

  it('does not count a quick update as a contact', async () => {
    const { svc, state } = setup({ stage: 'UNASSIGNED', firstContactedAt: null });
    await svc.logContact(actor, 'e1', { kind: FollowUpLogKind.QUICK_UPDATE, note: 'Will call Sunday' } as never);
    expect(state.firstContactedAt).toBeNull();
    expect(state.stage).toBe('UNASSIGNED');
  });

  it('uses the day the logger says the contact happened, never a future one', async () => {
    const { svc, state } = setup({ stage: 'ASSIGNED', firstContactedAt: null });
    await svc.logContact(actor, 'e1', { method: 'CALL', outcome: 'REACHED', note: 'Yesterday', contactedAt: '2026-11-10T09:00:00Z' } as never);
    expect(state.firstContactedAt?.toISOString()).toBe('2026-11-10T09:00:00.000Z');
  });
});
