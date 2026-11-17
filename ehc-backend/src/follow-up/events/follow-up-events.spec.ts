import { followUpEventDefinitions, safeFirstName } from './follow-up-events';

/** Spec section 6, test 17: what reaches a lock screen is a first name and an action, nothing more. */
describe('Follow-up event messages', () => {
  const defs = followUpEventDefinitions({} as never);
  const base = { visitorId: 'v1', firstName: 'Ada', unitId: 'u1', requesterId: 'p1', approvalId: 'a1', kind: 'FIRST_TIMER_INTEGRATION' };

  it('keeps only the first word of a first name, so a full name typed into one box never shows a surname', () => {
    expect(safeFirstName('Ada Okonkwo')).toBe('Ada');
    expect(safeFirstName('  Ada  ')).toBe('Ada');
    expect(safeFirstName('')).toBe('A first-timer');
    expect(safeFirstName(null)).toBe('A first-timer');
  });

  it('every message names the person by first name, links into the app, and carries nothing else', () => {
    const messages = [
      defs.registered.message({ visitorId: 'v1', firstName: 'Ada Okonkwo' }),
      defs.assigned.message({ assigneeMemberId: 'm1', visitorId: 'v1', firstName: 'Ada Okonkwo', entryId: 'e1' }),
      defs.requested.message({ ...base, firstName: 'Ada Okonkwo' }),
      defs.decided.message({ ...base, firstName: 'Ada Okonkwo', decision: 'APPROVED', adminOverride: false }),
      defs.decided.message({ ...base, firstName: 'Ada Okonkwo', decision: 'CHANGES_REQUESTED', adminOverride: true }),
    ];
    for (const m of messages) {
      expect(`${m.title} ${m.body}`).not.toMatch(/Okonkwo/);
      expect(m.body).toMatch(/^Ada /);
      expect(m.link).toBe('/dashboard/follow-up/person/v1');
    }
  });

  it('a bulk move says how many, with no names at all', () => {
    const m = defs.assigned.message({ assigneeMemberId: 'm1', count: 4, unitId: 'u1' });
    expect(m.body).toBe('4 first-timers are now yours to follow up.');
    expect(m.link).toBe('/dashboard/membership-assimilation/u1');
  });

  it('pushes the actionable events and keeps decisions in the app', () => {
    expect(defs.registered.push?.category).toBe('followUpUpdates');
    expect(defs.assigned.push?.category).toBe('followUpUpdates');
    expect(defs.requested.push?.category).toBe('followUpUpdates');
    expect(defs.decided.push).toBeUndefined();
  });
});
