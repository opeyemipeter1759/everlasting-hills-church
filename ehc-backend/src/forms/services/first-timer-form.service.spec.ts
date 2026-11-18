import { BadRequestException } from '@nestjs/common';
import { FirstTimerFormService } from './first-timer-form.service';
import { heardFromProblems } from '../first-timer-heard-from.schema';
import { lagosDay } from './first-timer-return';

function setup(existing: { visitorId?: string; memberId?: string } = {}) {
  const created: Record<string, unknown[]> = { visitor: [], visit: [] };
  const prisma = {
    $queryRaw: jest
      .fn()
      .mockResolvedValueOnce(existing.visitorId ? [{ id: existing.visitorId }] : [])
      .mockResolvedValueOnce(existing.memberId ? [{ id: existing.memberId }] : []),
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    visitor: { create: jest.fn(({ data }) => (created.visitor.push(data), Promise.resolve(data))) },
    firstTimerVisit: { create: jest.fn(({ data }) => (created.visit.push(data), Promise.resolve(data))) },
    formSubmission: { create: jest.fn().mockResolvedValue({}) },
  };
  const emailDispatch = { dispatch: jest.fn(), adminEmail: 'admin@example.com', appUrl: 'https://example.com' };
  // Sunday 15 November 2026 in Lagos is stored as 23:00 UTC the day before.
  const sessionWindow = { findOrCreateTodayService: jest.fn().mockResolvedValue({ id: 's1', scheduledAt: new Date('2026-11-14T23:00:00Z') }) };
  const events = { emit: jest.fn(), emitAsync: jest.fn().mockResolvedValue([]) };
  const svc = new FirstTimerFormService(prisma as never, emailDispatch as never, sessionWindow as never, events as never, { get: () => 't1' } as never);
  return { svc, created, events, emailDispatch };
}

const form = { first_name: 'Ada', last_name: 'Eze', phone_number: '0803 123 4567', how_did_you_learn: 'Social Media' };

describe('FirstTimerFormService', () => {
  it('records the first visit on the day of the service, and stores the phone as 234...', async () => {
    const { svc, created } = setup();
    await svc.submitFirstTimer({ ...form, is_student: true } as never);

    const visitor = created.visitor[0] as Record<string, unknown>;
    expect(visitor.phone).toBe('2348031234567');
    expect(visitor.isStudent).toBe(true);
    expect((visitor.firstVisitDate as Date).toISOString().slice(0, 10)).toBe('2026-11-15');
    expect(created.visit[0]).toMatchObject({ visitorId: visitor.id, source: 'FORM' });
  });

  it('flags a phone the church already has as a possible return visit, and never merges', async () => {
    const { svc, created } = setup({ visitorId: 'v-old' });
    await expect(svc.submitFirstTimer(form as never)).resolves.toMatchObject({ success: true });
    expect(created.visitor[0]).toMatchObject({ possibleReturnVisitorId: 'v-old', possibleReturnMemberId: null });
    expect(created.visitor).toHaveLength(1);
  });

  it('needs the inviter for Friend or Family, and a few words for Other', async () => {
    const { svc } = setup();
    await expect(svc.submitFirstTimer({ ...form, how_did_you_learn: 'Friend/Family' } as never)).rejects.toThrow(BadRequestException);
    await expect(setup().svc.submitFirstTimer({ ...form, how_did_you_learn: 'Other' } as never)).rejects.toThrow('Tell us how you heard about us');
    await expect(setup().svc.submitFirstTimer({ ...form, how_did_you_learn: 'Friend/Family', invited_by: 'Bisi' } as never)).resolves.toBeDefined();
  });
});

describe('after the form is saved', () => {
  const withEmail = { ...form, email: 'ada@example.com' };

  it('routes the new first-timer inside the request, and a routing failure still saves the form', async () => {
    const { svc, events } = setup();
    await svc.submitFirstTimer(form as never);
    expect(events.emitAsync).toHaveBeenCalledWith('visitor.created', expect.objectContaining({ visitorIds: [expect.any(String)] }));

    const failing = setup();
    failing.events.emitAsync.mockRejectedValue(new Error('routing down'));
    await expect(failing.svc.submitFirstTimer(form as never)).resolves.toMatchObject({ success: true });
  });

  it("sends the church's own welcome email, as it always has", async () => {
    const { svc, emailDispatch } = setup();
    await svc.submitFirstTimer(withEmail as never);
    expect(emailDispatch.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'ada@example.com', subject: 'Welcome to the Everlasting Hills family, Ada', tag: 'first-timer-welcome' }),
    );
  });
});

describe('heard-from rules', () => {
  it('only checks a value being set, so legacy rows and other edits pass', () => {
    expect(heardFromProblems({ howDidYouLearn: 'Friend/Family' })).toEqual(['Tell us who invited you']);
    expect(heardFromProblems({ howDidYouLearn: 'Other', heardFromOther: '' })).toEqual(['Tell us how you heard about us']);
    expect(heardFromProblems({ howDidYouLearn: 'Online' })).toEqual([]);
    expect(heardFromProblems({})).toEqual([]);
  });
});

describe('lagosDay', () => {
  it('puts 00:30 Lagos on 1 February (23:30 UTC on 31 January) in February', () => {
    expect(lagosDay(new Date('2026-01-31T23:30:00Z')).toISOString().slice(0, 10)).toBe('2026-02-01');
  });
});
