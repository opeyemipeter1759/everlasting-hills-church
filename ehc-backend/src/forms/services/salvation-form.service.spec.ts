import { SalvationDecisionType } from '@prisma/client';
import { SalvationFormService } from './salvation-form.service';

function setup(event: { id: string } | null = null) {
  const created = {
    id: 'd1',
    firstName: 'Grace',
    lastName: 'Okafor',
    email: 'grace@example.com',
    phone: null,
    decision: SalvationDecisionType.FIRST_TIME,
    location: 'Ibadan',
    churchName: null,
    interestedInBaptism: true,
    message: null,
    Event: null,
  };
  const prisma = {
    event: { findFirst: jest.fn().mockResolvedValue(event) },
    salvationDecision: {
      create: jest.fn().mockResolvedValue(created),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({ id: 'd1' }),
      update: jest.fn().mockResolvedValue(created),
    },
  };
  const dispatch = jest.fn();
  const emailDispatch = { dispatch, adminEmail: 'team@church.test' };
  const config = { get: jest.fn().mockReturnValue('tenant-1') };
  return {
    service: new SalvationFormService(prisma as never, emailDispatch as never, config as never),
    prisma,
    dispatch,
  };
}

const base = {
  first_name: ' Grace ',
  last_name: ' Okafor ',
  decision: SalvationDecisionType.FIRST_TIME,
};

describe('SalvationFormService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('records a decision with only a name and the decision itself', async () => {
    const { service, prisma } = setup();

    await service.submit(base as never);

    const data = prisma.salvationDecision.create.mock.calls[0][0].data;
    expect(data.firstName).toBe('Grace');
    expect(data.lastName).toBe('Okafor');
    expect(data.decision).toBe(SalvationDecisionType.FIRST_TIME);
    // Everything optional stays null rather than becoming an empty string.
    expect(data.email).toBeNull();
    expect(data.location).toBeNull();
  });

  // An unknown slug must never cost somebody their decision.
  it('still records the decision when the event slug matches nothing', async () => {
    const { service, prisma } = setup(null);

    await service.submit({ ...base, event_slug: 'no-such-event' } as never);

    expect(prisma.salvationDecision.create).toHaveBeenCalled();
    expect(prisma.salvationDecision.create.mock.calls[0][0].data.eventId).toBeNull();
  });

  it('links the event it came from when the slug resolves', async () => {
    const { service, prisma } = setup({ id: 'evt-1' });

    await service.submit({ ...base, event_slug: 'furnace-2026' } as never);

    expect(prisma.salvationDecision.create.mock.calls[0][0].data.eventId).toBe('evt-1');
  });

  it('links a signed-in member without requiring one', async () => {
    const { service, prisma } = setup();

    await service.submit(base as never, 'member-9');
    expect(prisma.salvationDecision.create.mock.calls[0][0].data.memberId).toBe('member-9');

    await service.submit(base as never);
    expect(prisma.salvationDecision.create.mock.calls[1][0].data.memberId).toBeNull();
  });

  // The team should know who to call without opening the dashboard.
  it('sends the whole submission to the team', async () => {
    const { service, dispatch } = setup();

    await service.submit(base as never);

    const mail = dispatch.mock.calls[0][0];
    expect(mail.to).toBe('team@church.test');
    expect(mail.subject).toContain('Grace Okafor');
    expect(mail.text).toContain('grace@example.com');
    expect(mail.text).toContain('Ibadan');
    expect(mail.text).toContain('Interested in baptism: Yes');
  });

  it('records who marked somebody as reached, and clears it when undone', async () => {
    const { service, prisma } = setup();

    await service.setContacted('d1', true, 'profile-3');
    const marked = prisma.salvationDecision.update.mock.calls[0][0].data;
    expect(marked.contactedAt).toBeInstanceOf(Date);
    expect(marked.contactedById).toBe('profile-3');

    await service.setContacted('d1', false, 'profile-3');
    const cleared = prisma.salvationDecision.update.mock.calls[1][0].data;
    expect(cleared.contactedAt).toBeNull();
    expect(cleared.contactedById).toBeNull();
  });

  it('filters the list to those still waiting', async () => {
    const { service, prisma } = setup();

    await service.list({ contacted: false });

    expect(prisma.salvationDecision.findMany.mock.calls[0][0].where.contactedAt).toBeNull();
  });
});
