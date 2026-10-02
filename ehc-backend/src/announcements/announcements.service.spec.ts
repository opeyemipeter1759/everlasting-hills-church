import { ConflictException, NotFoundException } from '@nestjs/common';
import { AnnouncementsService, READING_PLAN_RESHARE_WINDOW_MS } from './announcements.service';
import { PushEvents } from '../push/push.events';

/**
 * Covers the publish/unpublish pair.
 *
 * Unpublish is what an admin reaches for once an event has passed: the
 * announcement has to leave the member feed (which filters on PUBLISHED)
 * without the record of it, or the recipient count, being destroyed.
 */
function makeService(announcement: Record<string, unknown> | null) {
  const update = jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
    ...announcement,
    ...data,
  }));
  const prisma = {
    announcement: {
      findFirst: jest.fn().mockResolvedValue(announcement),
      update,
    },
  };
  const service = new AnnouncementsService(
    prisma as never,
    { createMany: jest.fn() } as never,
    { dispatch: jest.fn() } as never,
    { emit: jest.fn() } as never,
    { get: jest.fn().mockReturnValue('tenant-1') } as never,
  );
  return { service, update, prisma };
}

const published = {
  id: 'a-1',
  tenantId: 'tenant-1',
  title: 'At His Feet',
  body: 'An evening of worship.',
  status: 'PUBLISHED',
  recipients: 42,
  audience: 'all',
};

describe('AnnouncementsService.unpublish', () => {
  it('flips a published announcement back to DRAFT so the feed stops serving it', async () => {
    const { service, update } = makeService(published);

    const result = await service.unpublish('a-1');

    expect(update).toHaveBeenCalledWith({ where: { id: 'a-1' }, data: { status: 'DRAFT' } });
    expect(result.status).toBe('DRAFT');
  });

  it('leaves the recipient count alone — it is the record of what was sent', async () => {
    const { service, update } = makeService(published);

    const result = await service.unpublish('a-1');

    expect(update.mock.calls[0][0].data).not.toHaveProperty('recipients');
    expect(result.recipients).toBe(42);
  });

  it('is a no-op on something already in DRAFT', async () => {
    const { service, update } = makeService({ ...published, status: 'DRAFT' });

    await service.unpublish('a-1');

    expect(update).not.toHaveBeenCalled();
  });

  it('refuses an id from another tenant', async () => {
    const { service } = makeService(null);

    await expect(service.unpublish('a-1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

/**
 * Email audience resolution.
 *
 * Targeting "Visitor" used to fall through roleFilter() to the plain-member
 * branch, so an announcement aimed at first-timers silently went to members and
 * reached none of the 126 people who had actually filled in the welcome form.
 */
/** A member is either an address (ACTIVE, as Member.status defaults in the
 * schema) or an explicit { email, status } pair for the non-active cases. */
type MemberFixture = string | { email: string; status: string };

function makeAudienceService(options: {
  members?: MemberFixture[];
  visitors?: string[];
}) {
  const dispatch = jest.fn();
  const prisma = {
    profile: {
      findMany: jest.fn().mockResolvedValue(
        (options.members ?? []).map((m, i) => {
          const member = typeof m === 'string' ? { email: m, status: 'ACTIVE' } : m;
          return { id: `p${i}`, Member: member };
        }),
      ),
    },
    visitor: {
      findMany: jest.fn().mockResolvedValue((options.visitors ?? []).map((email) => ({ email }))),
    },
    announcement: { create: jest.fn(async ({ data }) => ({ ...data })) },
  };
  const service = new AnnouncementsService(
    prisma as never,
    { createMany: jest.fn().mockResolvedValue(0) } as never,
    { dispatch } as never,
    { emit: jest.fn() } as never,
    { get: jest.fn().mockReturnValue('tenant-1') } as never,
  );
  return { service, dispatch, prisma };
}

const BASE_DTO = {
  title: 'Wednesday Service',
  body: 'Join us tonight.',
  sendEmail: true,
  status: 'PUBLISHED' as const,
};

function sentTo(dispatch: jest.Mock): string[] {
  return dispatch.mock.calls.map((call) => call[0].to).sort();
}

describe('AnnouncementsService email audience', () => {
  it('sends to first-timers, not members, when only VISITOR is targeted', async () => {
    const { service, dispatch, prisma } = makeAudienceService({
      members: ['member@example.com'],
      visitors: ['first@example.com', 'second@example.com'],
    });

    await service.create({ ...BASE_DTO, targetRoles: ['VISITOR'] } as never, null);

    expect(sentTo(dispatch)).toEqual(['first@example.com', 'second@example.com']);
    // Only unconverted first-timers — a converted one is reachable as a member.
    expect(prisma.visitor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ convertedAt: null }) }),
    );
  });

  it('never sends a first-timer a second copy of what they get as a member', async () => {
    const { service, dispatch } = makeAudienceService({
      members: ['Shared@Example.com'],
      visitors: ['shared@example.com', 'other@example.com'],
    });

    await service.create({ ...BASE_DTO, targetRoles: ['MEMBER', 'VISITOR'] } as never, null);

    expect(sentTo(dispatch)).toEqual(['Shared@Example.com', 'other@example.com']);
  });

  // Marking someone non-active has to take their email away too, or the one
  // thing an admin can do about a person who asked to be left alone keeps
  // mailing them.
  it('leaves a non-active member out of the audience', async () => {
    const { service, dispatch } = makeAudienceService({
      members: [
        'active@example.com',
        { email: 'left@example.com', status: 'INACTIVE' },
        { email: 'optedout@example.com', status: 'OPTED_OUT' },
      ],
    });

    await service.create({ ...BASE_DTO, targetRoles: ['MEMBER'] } as never, null);

    expect(sentTo(dispatch)).toEqual(['active@example.com']);
  });

  // A non-active member who is also an unconverted first-timer must not be
  // quietly reached through the visitor list instead.
  it('does not reach a non-active member through the first-timer list', async () => {
    const { service, dispatch } = makeAudienceService({
      members: [{ email: 'left@example.com', status: 'INACTIVE' }],
      visitors: ['left@example.com'],
    });

    await service.create({ ...BASE_DTO, targetRoles: ['MEMBER', 'VISITOR'] } as never, null);

    expect(sentTo(dispatch)).toEqual([]);
  });

  it('addresses a first-timer as a first-timer, not as a member', async () => {
    const { service, dispatch } = makeAudienceService({ visitors: ['first@example.com'] });

    await service.create({ ...BASE_DTO, targetRoles: ['VISITOR'] } as never, null);

    const { html, text } = dispatch.mock.calls[0][0];
    expect(html).toContain('first-timer form');
    expect(html).not.toContain('part of the Everlasting Hills Church family');
    // No account, so no dashboard to send them to.
    expect(html).not.toContain('View in Dashboard');
    expect(text).not.toContain('member dashboard');
  });

  it('leaves an untargeted announcement church-wide and visitor-free', async () => {
    const { service, dispatch, prisma } = makeAudienceService({
      members: ['member@example.com'],
      visitors: ['first@example.com'],
    });

    await service.create({ ...BASE_DTO } as never, null);

    expect(sentTo(dispatch)).toEqual(['member@example.com']);
    expect(prisma.visitor.findMany).not.toHaveBeenCalled();
  });
});

/**
 * Sharing a reading plan with the whole church: every member is notified with
 * a link that opens the plan, and the share is kept as an announcement.
 */
const PLAN_LINK = '/dashboard/reading/plans?plan=bible-in-four-months';
const SHARE = {
  plan: { title: 'The Bible in four months', subtitle: 'Six readings a day.', slug: 'bible-in-four-months' },
  note: '  We start together on Monday.  ',
  sendEmail: false,
  sharedById: 'admin-profile',
};

function makeShareService(options: { recentShare?: boolean; members?: string[] } = {}) {
  const members = options.members ?? ['a@example.com', 'b@example.com'];
  const createMany = jest.fn().mockResolvedValue(members.length);
  const dispatch = jest.fn();
  const emit = jest.fn();
  const prisma = {
    profile: {
      findMany: jest.fn().mockResolvedValue(
        members.map((email, i) => ({ id: `p${i}`, Member: { email, firstName: 'Ada', status: 'ACTIVE' } })),
      ),
    },
    announcement: {
      findFirst: jest.fn().mockResolvedValue(options.recentShare ? { id: 'earlier-share' } : null),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ ...data })),
    },
  };
  const config = {
    get: jest.fn((key: string) => (key === 'FRONTEND_URL' ? 'https://www.everlastinghills.church/' : 'tenant-1')),
  };
  const service = new AnnouncementsService(
    prisma as never,
    { createMany } as never,
    { dispatch } as never,
    { emit } as never,
    config as never,
  );
  return { service, prisma, createMany, dispatch, emit };
}

describe('AnnouncementsService.announceReadingPlan', () => {
  afterEach(() => jest.useRealTimers());

  it('notifies every member with a link that opens the plan, and records it as an announcement', async () => {
    const { service, createMany, prisma, emit } = makeShareService();

    const result = await service.announceReadingPlan(SHARE);

    const notifications = createMany.mock.calls[0][0];
    expect(notifications).toHaveLength(2);
    expect(notifications[0]).toMatchObject({
      profileId: 'p0',
      title: 'Read with us: The Bible in four months',
      body: 'We start together on Monday.\n\nSix readings a day.',
      link: PLAN_LINK,
    });
    expect(prisma.announcement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Read with us: The Bible in four months',
        audience: 'all',
        status: 'PUBLISHED',
        createdById: 'admin-profile',
        recipients: 2,
        sendEmail: false,
      }),
    });
    expect(emit).toHaveBeenCalledWith(
      PushEvents.AnnouncementPublished,
      expect.objectContaining({ url: PLAN_LINK, audience: 'all' }),
    );
    expect(result).toEqual({ id: expect.any(String), recipients: 2 });
  });

  it('sends no email unless the admin asks for one', async () => {
    const { service, dispatch } = makeShareService();

    await service.announceReadingPlan(SHARE);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('emails members a button that starts the plan, at the full site address', async () => {
    const { service, dispatch } = makeShareService({ members: ['ada@example.com'] });

    await service.announceReadingPlan({ ...SHARE, sendEmail: true });

    const { to, html, text } = dispatch.mock.calls[0][0];
    expect(to).toBe('ada@example.com');
    expect(html).toContain('Start the plan');
    expect(html).toContain(`https://www.everlastinghills.church${PLAN_LINK}`);
    expect(html).not.toContain('View in Dashboard');
    expect(text).toContain(
      `Start the plan in your member dashboard:\nhttps://www.everlastinghills.church${PLAN_LINK}`,
    );
  });

  it('refuses to notify the church about the same plan twice within minutes', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-02T10:00:00Z') });
    const { service, createMany, prisma, emit } = makeShareService({ recentShare: true });

    await expect(service.announceReadingPlan(SHARE)).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.announcement.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        title: 'Read with us: The Bible in four months',
        createdAt: { gte: new Date(Date.parse('2026-10-02T10:00:00Z') - READING_PLAN_RESHARE_WINDOW_MS) },
      },
      select: { id: true },
    });
    expect(createMany).not.toHaveBeenCalled();
    expect(prisma.announcement.create).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('still tells members what to do when there is no note and no subtitle', async () => {
    const { service, createMany } = makeShareService();

    await service.announceReadingPlan({ ...SHARE, note: '   ', plan: { ...SHARE.plan, subtitle: null } });

    expect(createMany.mock.calls[0][0][0].body).toBe(
      'Start The Bible in four months from the Bible plans in your dashboard.',
    );
  });
});
