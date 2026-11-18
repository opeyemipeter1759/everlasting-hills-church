import { type AuditRow, buildFeed, recordSummary } from './audit-feed';

const t0 = new Date('2026-11-18T09:00:00.000Z').getTime();
const at = (s: number) => new Date(t0 + s * 1000);

function request(id: string, s: number, actorId = 'u1', summary = 'Delete a first-timer for good (ADMIN+)'): AuditRow {
  return {
    id, actorId, action: 'REQUEST', entity: 'visitors', entityId: 'v1', before: null, createdAt: at(s),
    after: { summary, method: 'DELETE', route: '/visitors/:id', params: { id: 'v1' }, targets: [{ kind: 'First-timer', name: 'Ada Eze' }], body: null },
  };
}
function record(id: string, s: number, actorId: string | null = 'u1'): AuditRow {
  return { id, actorId, action: 'DELETE', entity: 'Visitor', entityId: 'v1', before: { firstName: 'Ada' }, after: null, createdAt: at(s) };
}

describe('the audit trail feed', () => {
  it('folds the record a service logged into the request that made it', () => {
    const items = buildFeed([request('r1', 2), record('d1', 1)], [], { surface: false });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 'r1', kind: 'request', summary: 'Delete a first-timer for good', method: 'DELETE',
      targets: [{ kind: 'First-timer', name: 'Ada Eze' }],
    });
    expect(items[0].records.map((r) => r.id)).toEqual(['d1']);
  });

  it("does not fold someone else's record, or one from long before", () => {
    const items = buildFeed([request('r1', 100), record('d-other', 99, 'u2'), record('d-old', 10)], [], { surface: false });
    expect(items.map((i) => i.id)).toEqual(['r1', 'd-other', 'd-old']);
    expect(items[0].records).toEqual([]);
  });

  it("gives each record to the same person's next request, not a later one", () => {
    const items = buildFeed([request('r2', 20), record('d2', 19), request('r1', 10), record('d1', 9)], [], { surface: false });
    expect(items.map((i) => [i.id, i.records.map((r) => r.id)])).toEqual([['r2', ['d2']], ['r1', ['d1']]]);
  });

  it('shows records nobody requested (jobs, older rows) on their own', () => {
    const items = buildFeed([record('job', 5, null)], [], { surface: false });
    expect(items[0]).toMatchObject({ kind: 'record', summary: 'Delete: visitor', records: [{ id: 'job' }] });
  });

  it('folds in a record from the next page, and drops a record whose request is on the page before', () => {
    expect(buildFeed([request('r1', 2)], [record('d1', 1)], { surface: false })[0].records.map((r) => r.id)).toEqual(['d1']);
    expect(buildFeed([record('d1', 1)], [request('r1', 2)], { surface: false })).toEqual([]);
  });

  it('when a search matched only the record, shows its request instead', () => {
    const items = buildFeed([record('d1', 1)], [request('r1', 2)], { surface: true });
    expect(items.map((i) => i.id)).toEqual(['r1']);
    expect(items[0].records.map((r) => r.id)).toEqual(['d1']);
  });

  it('names a record by its action and entity', () => {
    expect(recordSummary('APPROVAL_DECIDED', 'ApprovalRequest')).toBe('Approval decided: approval request');
  });
});
