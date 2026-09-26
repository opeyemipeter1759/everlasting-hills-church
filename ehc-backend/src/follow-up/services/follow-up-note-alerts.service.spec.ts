import { NotificationEvents } from '../../notifications/notification-events';
import { ALERT_TYPE, FollowUpNoteAlertsService } from './follow-up-note-alerts.service';

const FOLLOW_UP_UNIT = { id: 'unit-fu', name: 'Follow Up', departmentId: null };
const INTEGRATION_UNIT = { id: 'unit-int', name: 'Integration Team', departmentId: null };

const MEMBERS: Record<string, { profileId: string; firstName: string; lastName: string; email: string | null }> = {
  author: { profileId: 'author', firstName: 'Ada', lastName: 'Obi', email: 'ada@x.org' },
  assignee: { profileId: 'assignee', firstName: 'Bola', lastName: 'Ade', email: 'bola@x.org' },
  chatter: { profileId: 'chatter', firstName: 'Chidi', lastName: 'Eze', email: 'chidi@x.org' },
  quiet: { profileId: 'quiet', firstName: 'Dayo', lastName: 'Ola', email: null },
};

function setup({
  status = 'FIRST_TIMER',
  assigneeProfileId = 'assignee' as string | null,
  posters = ['author', 'chatter'],
  waiting = [] as string[],
} = {}) {
  const createMany = jest.fn().mockResolvedValue(1);
  const emit = jest.fn();
  const prisma = {
    member: {
      findUnique: jest.fn().mockResolvedValue(assigneeProfileId ? { profileId: assigneeProfileId } : null),
      findFirst: jest.fn(({ where }) => Promise.resolve(MEMBERS[where.profileId] ?? null)),
      findMany: jest.fn(({ where }) => Promise.resolve(where.profileId.in.map((id: string) => MEMBERS[id]).filter(Boolean))),
    },
    followUpNote: { findMany: jest.fn().mockResolvedValue(posters.map((authorId) => ({ authorId }))) },
    notification: { findMany: jest.fn().mockResolvedValue(waiting.map((profileId) => ({ profileId }))) },
    unit: {
      findMany: jest.fn(({ where }) =>
        Promise.resolve(where.name.contains === 'integration' ? [INTEGRATION_UNIT] : [FOLLOW_UP_UNIT]),
      ),
    },
  };
  const people = {
    get: jest.fn().mockResolvedValue({
      name: 'Tunde Bello',
      status,
      assignedTo: assigneeProfileId ? { id: 'assignee-member', name: 'Bola Ade' } : null,
    }),
  };
  const config = { get: (k: string) => (k === 'FRONTEND_URL' ? 'https://church.test' : 'tenant') };
  const svc = new FollowUpNoteAlertsService(prisma as never, people as never, { createMany } as never, { emit } as never, config as never);
  const emailsTo = () => emit.mock.calls.map(([, payload]) => payload.to).sort();
  const alertedIds = () => (createMany.mock.calls[0]?.[0] ?? []).map((n: { profileId: string }) => n.profileId).sort();
  return { svc, createMany, emit, prisma, emailsTo, alertedIds };
}

describe('FollowUpNoteAlertsService.onNewMessage', () => {
  it('tells the assignee and everyone else in the conversation, never the author', async () => {
    const { svc, alertedIds, emailsTo, emit } = setup();
    await svc.onNewMessage('author', 'VISITOR', 'v1', 'Called her, she is coming Sunday');

    expect(alertedIds()).toEqual(['assignee', 'chatter']);
    expect(emailsTo()).toEqual(['bola@x.org', 'chidi@x.org']);
    expect(emit.mock.calls[0][0]).toBe(NotificationEvents.SendEmail);
  });

  it('says why each person is hearing about it', async () => {
    const { svc, emit } = setup();
    await svc.onNewMessage('author', 'VISITOR', 'v1', 'Hello');
    const byTo = Object.fromEntries(emit.mock.calls.map(([, p]) => [p.to, p.text]));
    expect(byTo['bola@x.org']).toContain("You're assigned to Tunde Bello");
    expect(byTo['chidi@x.org']).toContain("You've been part of the conversation");
  });

  it('still alerts people with no email address in the app', async () => {
    const { svc, alertedIds, emailsTo } = setup({ posters: ['author', 'quiet'], assigneeProfileId: null });
    await svc.onNewMessage('author', 'MEMBER', 'm1', 'Hi');
    expect(alertedIds()).toEqual(['quiet']);
    expect(emailsTo()).toEqual([]);
  });

  it('does not alert anyone who already has an unread alert about this person from the last half hour', async () => {
    const { svc, alertedIds, emailsTo, prisma } = setup({ waiting: ['chatter'] });
    await svc.onNewMessage('author', 'VISITOR', 'v1', 'Another update');
    expect(alertedIds()).toEqual(['assignee']);
    expect(emailsTo()).toEqual(['bola@x.org']);
    expect(prisma.notification.findMany.mock.calls[0][0].where).toMatchObject({ type: ALERT_TYPE, readAt: null });
  });

  it('sends nothing when the author is the only one involved', async () => {
    const { svc, createMany, emit } = setup({ posters: ['author'], assigneeProfileId: 'author' });
    await svc.onNewMessage('author', 'VISITOR', 'v1', 'Note to self');
    expect(createMany).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('links to the Follow Up board, or the Integration board for integrated members', async () => {
    const followUp = setup();
    await followUp.svc.onNewMessage('author', 'MEMBER', 'm1', 'Hi');
    expect(followUp.createMany.mock.calls[0][0][0].link).toBe('/dashboard/membership-assimilation/unit-fu?thread=MEMBER%3Am1');

    const integrated = setup({ status: 'INTEGRATED' });
    await integrated.svc.onNewMessage('author', 'MEMBER', 'm1', 'Hi');
    expect(integrated.createMany.mock.calls[0][0][0].link).toBe('/dashboard/membership-assimilation/unit-int?thread=MEMBER%3Am1');
    expect(integrated.emit.mock.calls[0][1].html).toContain('https://church.test/dashboard/membership-assimilation/unit-int');
  });

  it('never throws: a failure is logged, and posting is unaffected', async () => {
    const { svc, prisma } = setup();
    prisma.followUpNote.findMany.mockRejectedValueOnce(new Error('db down'));
    await expect(svc.onNewMessage('author', 'VISITOR', 'v1', 'Hi')).resolves.toBeUndefined();
  });
});
