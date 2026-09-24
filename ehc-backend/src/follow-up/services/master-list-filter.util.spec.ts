import { inScope, matchesFilters, missedService } from './master-list-filter.util';
import type { MasterListRow } from './master-list.util';

function row(over: Partial<MasterListRow>): MasterListRow {
  return {
    id: 'x',
    kind: 'MEMBER',
    name: 'Someone',
    photoUrl: null,
    assignedTo: null,
    status: 'FIRST_TIMER',
    hasAccount: true,
    attended: 0,
    since: '2026-03-01T00:00:00.000Z',
    latestEntryAt: null,
    ...over,
  };
}

const page = { take: 25, skip: 0 };

describe('list scopes', () => {
  it("drops anyone integrated from Follow Up's list — that work is done", () => {
    expect(inScope('FIRST_TIMER', 'FOLLOW_UP')).toBe(true);
    expect(inScope('AWAY', 'FOLLOW_UP')).toBe(true);
    expect(inScope('OPTED_OUT', 'FOLLOW_UP')).toBe(true);
    expect(inScope('INTEGRATED', 'FOLLOW_UP')).toBe(false);
  });

  it('gives the Integration Team the integrated and the ones who stopped coming', () => {
    expect(inScope('INTEGRATED', 'INTEGRATION')).toBe(true);
    expect(inScope('AWAY', 'INTEGRATION')).toBe(true);
    expect(inScope('FIRST_TIMER', 'INTEGRATION')).toBe(false);
    expect(inScope('OPTED_OUT', 'INTEGRATION')).toBe(false);
  });

  it('shows everyone when no scope is named', () => {
    expect(inScope('INTEGRATED')).toBe(true);
    expect(inScope('FIRST_TIMER', 'ALL')).toBe(true);
  });

  it('applies the scope before any filter the person chose', () => {
    const integrated = row({ status: 'INTEGRATED' });

    expect(matchesFilters(integrated, { ...page, scope: 'FOLLOW_UP' })).toBe(false);
    expect(matchesFilters(integrated, { ...page, scope: 'FOLLOW_UP', status: 'INTEGRATED' })).toBe(false);
    expect(matchesFilters(integrated, { ...page, scope: 'INTEGRATION', status: 'INTEGRATED' })).toBe(true);
  });

  it('still honours assignee and date filters inside a scope', () => {
    const away = row({ status: 'AWAY', assignedTo: { id: 'm-1', name: 'Ruth' } });

    expect(matchesFilters(away, { ...page, scope: 'INTEGRATION', assigneeId: 'm-1' })).toBe(true);
    expect(matchesFilters(away, { ...page, scope: 'INTEGRATION', assigneeId: 'none' })).toBe(false);
    expect(matchesFilters(away, { ...page, scope: 'INTEGRATION', from: '2026-06-01' })).toBe(false);
  });
});

describe('missedService', () => {
  const attendance = {
    presentIds: new Set(['came']),
    dayEndMs: new Date('2026-09-23T23:00:00.000Z').getTime(),
  };

  it('counts a member with no check-in for the service', () => {
    expect(missedService(row({ id: 'stayed-home' }), attendance)).toBe(true);
  });

  it('leaves out whoever checked in', () => {
    expect(missedService(row({ id: 'came' }), attendance)).toBe(false);
  });

  it('leaves out members who joined after the service', () => {
    expect(missedService(row({ id: 'new', since: '2026-09-25T10:00:00.000Z' }), attendance)).toBe(false);
  });

  it('leaves out first-timers with no account', () => {
    expect(missedService(row({ id: 'v-1', kind: 'VISITOR' }), attendance)).toBe(false);
  });
});
