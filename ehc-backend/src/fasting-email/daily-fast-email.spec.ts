import { DailyFastEmailService } from './daily-fast-email.service';
import { EmailUnsubscribeService } from './email-unsubscribe.service';
import { buildDailyFastEmail, type DailyFastDay } from '../notifications/templates/daily-fast.email';

const RULES = {
  startDate: '2026-10-02',
  endDate: '2026-10-31',
  mealTime: '3pm',
  dryFasts: [{ startDate: '2026-10-03', endDate: '2026-10-04', breakTime: '3pm' }],
  morningTime: '6am',
  eveningTime: '8pm',
  noMorningDays: [0],
  noEveningDays: [6],
  serviceDays: [0],
};
const FAST = {
  eventSlug: 'furnace-2026',
  eventTitle: 'Furnace 2026',
  theme: 'Dominion',
  imageUrl: 'https://x.test/flyer.jpg',
  liveUrl: 'https://youtube.com/@everlastinghillschurch',
  rules: RULES,
};

const config = { get: (k: string) => (k === 'CMS_REVALIDATE_SECRET' ? 's'.repeat(40) : k === 'FRONTEND_URL' ? 'https://church.test' : 'tenant') } as never;

function setup({ sent = [] as string[], unsubscribed = [] as string[], deliver = jest.fn().mockResolvedValue(undefined) } = {}) {
  const upsert = jest.fn().mockResolvedValue({});
  const prisma = {
    member: { findMany: jest.fn().mockResolvedValue([{ email: 'Ada@X.test ', firstName: 'Ada' }, { email: 'bola@x.test', firstName: 'Bola' }]) },
    visitor: {
      findMany: jest.fn().mockResolvedValue([
        { email: 'ada@x.test', firstName: 'Ada again' },
        { email: 'chi@x.test', firstName: 'Chi' },
        { email: 'not-an-email', firstName: 'X' },
      ]),
    },
    dailyEmailLog: { findMany: jest.fn().mockResolvedValue(sent.map((email) => ({ email }))), upsert },
    emailUnsubscribe: { findMany: jest.fn().mockResolvedValue(unsubscribed.map((email) => ({ email }))) },
    fastingRecap: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const unsub = new EmailUnsubscribeService(prisma as never, config);
  const fasts = { on: jest.fn().mockResolvedValue(FAST), tenant: 'tenant' };
  const youtube = { configured: false };
  const svc = new DailyFastEmailService(prisma as never, { deliver } as never, youtube as never, fasts as never, unsub);
  return { svc, deliver, upsert };
}

describe('the daily fasting email', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    jest.setSystemTime(new Date('2026-10-02T03:30:00Z')); // 4:30am in Lagos on Day 1
  });
  afterEach(() => jest.useRealTimers());

  const runAll = async (svc: DailyFastEmailService) => {
    const p = svc.run();
    await jest.runAllTimersAsync();
    return p;
  };

  it('goes to every member and visitor once, skipping bad addresses', async () => {
    const { svc, deliver } = setup();
    const result = await runAll(svc);
    expect(deliver.mock.calls.map((c) => c[0].to).sort()).toEqual(['ada@x.test', 'bola@x.test', 'chi@x.test']);
    expect(result).toMatchObject({ day: '2026-10-02', sent: 3, failed: 0 });
    // Visitors too: not limited to active members.
    expect(deliver.mock.calls.every((c) => !c[0].memberOnly)).toBe(true);
  });

  it("never emails anyone who unsubscribed, or anyone already sent today's", async () => {
    const { svc, deliver } = setup({ sent: ['bola@x.test'], unsubscribed: ['chi@x.test'] });
    const result = await runAll(svc);
    expect(deliver.mock.calls.map((c) => c[0].to)).toEqual(['ada@x.test']);
    expect(result.skipped).toBe(2);
  });

  it('waits and retries when Resend says slow down, and logs the send', async () => {
    const deliver = jest.fn().mockRejectedValueOnce(new Error('Resend rejected: rate_limit_exceeded')).mockResolvedValue(undefined);
    const { svc, upsert } = setup({ deliver });
    const result = await runAll(svc);
    expect(result.sent).toBe(3);
    expect(upsert.mock.calls.every((c) => c[0].create.status === 'SENT')).toBe(true);
  });

  it('logs a real failure and carries on', async () => {
    const deliver = jest.fn().mockRejectedValueOnce(new Error('Resend rejected: invalid address')).mockResolvedValue(undefined);
    const { svc, upsert } = setup({ deliver });
    const result = await runAll(svc);
    expect(result).toMatchObject({ sent: 2, failed: 1 });
    expect(upsert.mock.calls[0][0].create).toMatchObject({ status: 'FAILED', campaign: 'fast:furnace-2026', day: '2026-10-02' });
  });

  it('sends nothing outside a fast', async () => {
    const { svc, deliver } = setup();
    (svc as unknown as { fasts: { on: jest.Mock } }).fasts.on.mockResolvedValue(null);
    expect(await runAll(svc)).toMatchObject({ day: null, sent: 0 });
    expect(deliver).not.toHaveBeenCalled();
  });
});

describe('what the email says', () => {
  const day = (over: Partial<DailyFastDay> = {}): DailyFastDay => ({
    fastName: 'Furnace 2026',
    theme: 'Dominion',
    dateLabel: 'Sunday 4 October',
    dayNumber: 3,
    totalDays: 30,
    kind: 'dry',
    mealTime: '3pm',
    dryDay: 2,
    dryLength: 2,
    breakTime: '3pm',
    isFirst: false,
    isLast: false,
    morning: 'Sunday service',
    evening: '8pm evening prayer',
    liveUrl: 'https://youtube.com/@everlastinghillschurch',
    ...over,
  });
  const build = (d: DailyFastDay, recap = true) =>
    buildDailyFastEmail({
      to: 'ada@x.test',
      firstName: 'ada',
      day: d,
      yesterday: [
        {
          title: 'Day 2 Morning Prayer',
          url: 'https://youtube.com/watch?v=a',
          recap: recap ? { title: 'Standing in the fire', summary: 'We prayed for strength.', keyPoints: ['Daniel 3:25'] } : null,
        },
      ],
      imageUrl: 'https://x.test/flyer.jpg',
      unsubscribe: { page: 'https://church.test/unsubscribe?e=a&t=b', oneClick: 'https://church.test/api/unsubscribe?e=a&t=b' },
      eventUrl: 'https://church.test/events/furnace-2026',
    });

  it('says when to break the fast, in the subject and the body', () => {
    const mail = build(day());
    expect(mail.subject).toBe('Furnace 2026 · Day 3 of 30: break your fast at 3pm');
    expect(mail.text).toContain('Break your fast today at 3pm.');
    expect(mail.text).toContain('Good morning Ada,');
  });

  it("recaps yesterday's sessions, or links to one YouTube hasn't finished", () => {
    expect(build(day()).text).toContain('Standing in the fire');
    expect(build(day(), false).text).toContain('still being prepared. Watch it here: https://youtube.com/watch?v=a');
  });

  it('warns that today is the last meal before a dry fast', () => {
    const mail = build(day({ kind: 'meal', dryDay: undefined, dryLength: undefined, breakTime: undefined, lastMealBefore: { days: 3 } }));
    expect(mail.subject).toContain('one meal at 3pm, then the dry fast begins');
    expect(mail.text).toContain('last meal before the 3-day dry fast');
  });

  it('always attaches the flyer, and carries one-click unsubscribe', () => {
    const mail = build(day());
    expect(mail.attachments).toEqual([{ filename: 'Furnace-2026.jpg', url: 'https://x.test/flyer.jpg' }]);
    expect(mail.headers).toMatchObject({
      'List-Unsubscribe': '<https://church.test/api/unsubscribe?e=a&t=b>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    });
    expect(mail.text).toContain('Stop these daily emails: https://church.test/unsubscribe?e=a&t=b');
  });
});

describe('unsubscribe links', () => {
  const upsert = jest.fn().mockResolvedValue({});
  const svc = new EmailUnsubscribeService({ emailUnsubscribe: { upsert } } as never, config);

  it('are signed per address, so nobody can unsubscribe someone else', async () => {
    const token = svc.token('Ada@X.test');
    await expect(svc.unsubscribe('ada@x.test', token)).resolves.toEqual({ email: 'ada@x.test' });
    await expect(svc.unsubscribe('bola@x.test', token)).rejects.toThrow('not valid');
    expect(svc.links('ada@x.test').page).toBe(`https://church.test/unsubscribe?e=ada%40x.test&t=${token}`);
  });
});
