import { windowEnd, windowState, type WindowInput } from './evangelism-window.util';
import { normaliseNigerianPhone } from './evangelism-phone.util';

const at = (iso: string) => new Date(iso);

function contact(over: Partial<WindowInput> = {}): WindowInput {
  const contactDate = at('2026-09-01T10:00:00Z');
  return {
    contactDate,
    windowEndsAt: windowEnd(contactDate),
    status: 'NEW',
    callBackAt: null,
    lastActionAt: null,
    reviewOutcome: null,
    closedAt: null,
    ...over,
  };
}

describe('the 30-day follow-up window', () => {
  it('counts the days: day 1 on the day, day 12 eleven days later, never past 30', () => {
    expect(windowState(contact(), at('2026-09-01T18:00:00Z'))).toMatchObject({ day: 1, of: 30 });
    expect(windowState(contact(), at('2026-09-12T12:00:00Z'))).toMatchObject({ day: 12 });
    expect(windowState(contact(), at('2026-11-20T12:00:00Z'))).toMatchObject({ day: 30 });
  });

  it('is fine for the first two days, due on the third, overdue after', () => {
    expect(windowState(contact(), at('2026-09-02T12:00:00Z')).flag).toBeNull();
    expect(windowState(contact(), at('2026-09-03T12:00:00Z')).flag).toBe('DUE');
    expect(windowState(contact(), at('2026-09-04T12:00:00Z')).flag).toBe('OVERDUE');
  });

  it('starts counting again from the last follow-up logged', () => {
    const c = contact({ lastActionAt: at('2026-09-10T09:00:00Z') });
    expect(windowState(c, at('2026-09-11T09:00:00Z')).flag).toBeNull();
    expect(windowState(c, at('2026-09-14T09:00:00Z')).flag).toBe('OVERDUE');
  });

  it('is overdue once a promised call-back date has passed', () => {
    const c = contact({ status: 'CALL_BACK', callBackAt: at('2026-09-05T09:00:00Z'), lastActionAt: at('2026-09-05T08:00:00Z') });
    expect(windowState(c, at('2026-09-05T12:00:00Z')).flag).toBe('DUE');
    expect(windowState(c, at('2026-09-06T12:00:00Z')).flag).toBe('OVERDUE');
  });

  it('asks the leader to review when the window runs out', () => {
    expect(windowState(contact({ lastActionAt: at('2026-09-30T09:00:00Z') }), at('2026-10-01T12:00:00Z')).flag).toBe('REVIEW');
  });

  it('has nothing due once they joined, said no, or were handed over or closed', () => {
    const later = at('2026-09-20T12:00:00Z');
    expect(windowState(contact({ status: 'JOINED' }), later)).toMatchObject({ open: false, flag: null });
    expect(windowState(contact({ status: 'NOT_INTERESTED' }), later).flag).toBeNull();
    expect(windowState(contact({ reviewOutcome: 'HANDED_OVER' }), later).flag).toBeNull();
    expect(windowState(contact({ closedAt: later }), later).open).toBe(false);
  });

  it('keeps following up through an extension', () => {
    const c = contact({ reviewOutcome: 'EXTENDED', windowEndsAt: at('2026-10-31T10:00:00Z'), lastActionAt: at('2026-10-05T10:00:00Z') });
    expect(windowState(c, at('2026-10-06T10:00:00Z'))).toMatchObject({ open: true, flag: null, of: 60 });
  });
});

describe('Nigerian phone numbers', () => {
  it.each([
    ['0803 123 4567', '+2348031234567'],
    ['+234 803 123 4567', '+2348031234567'],
    ['2348031234567', '+2348031234567'],
    ['803-123-4567', '+2348031234567'],
    ['09012345678', '+2349012345678'],
    ['07061234567', '+2347061234567'],
  ])('reads %s', (input, out) => expect(normaliseNigerianPhone(input)).toBe(out));

  it.each(['12345', '0603 123 4567', '+44 7700 900123', 'phone'])('refuses %s', (input) =>
    expect(normaliseNigerianPhone(input)).toBeNull(),
  );
});
